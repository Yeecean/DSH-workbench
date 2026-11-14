/** Resolve and validate the current account's shared runtime-signature cache. */
import { mkdir, realpath } from 'node:fs/promises'
import { homedir } from 'node:os'
import { resolve, win32 } from 'node:path'
import koffi from 'koffi'

/**
 * Resolve the file-owned override or the current account's signing-state cache without reading its contents.
 * @param {NodeJS.ProcessEnv} environment File-owned packaging configuration.
 * @returns {string} Absolute local cache path; relative, network, device and alternate-stream paths are rejected.
 */
export function resolveWindowsSignatureCacheDirectory(environment) {
  const path = environment.DSH_DESKTOP_WINDOWS_SIGNATURE_CACHE_DIR
    ?? win32.join(homedir(), '.dsh-desktop-signing', 'signature-cache', 'v1')
  if (!/^[a-z]:[\\/]/iu.test(path) || path.slice(2).includes(':') || /[\0\r\n]/u.test(path)) {
    throw new Error('DSH_DESKTOP_WINDOWS_SIGNATURE_CACHE_DIR must be an absolute local drive directory')
  }
  return win32.resolve(path)
}

/**
 * Create private current-account storage or validate an explicitly selected migration source.
 * @param {string} path Absolute local directory.
 * @param {boolean} existingSource Require an existing, current-account-owned migration source without changing its permissions.
 * @returns {Promise<void>} Resolves after checking drive type, ancestor links, ownership and destination permissions.
 */
const DRIVE_FIXED = 3
const INVALID_FILE_ATTRIBUTES = 0xFFFFFFFF
const FILE_ATTRIBUTE_DIRECTORY = 0x10
const FILE_ATTRIBUTE_REPARSE_POINT = 0x400
const TOKEN_QUERY = 0x0008
const TOKEN_USER = 1
const SE_FILE_OBJECT = 1
const OWNER_SECURITY_INFORMATION = 0x00000001
const DACL_SECURITY_INFORMATION = 0x00000004
const PROTECTED_DACL_SECURITY_INFORMATION = 0x80000000
const ACL_REVISION = 2
const ACL_SIZE_INFORMATION = 2
const CONTAINER_INHERIT_ACE = 0x02
const OBJECT_INHERIT_ACE = 0x01
const FILE_ALL_ACCESS = 0x001F01FF
const ACCESS_ALLOWED_ACE_TYPE = 0
const ALLOW_ACE_TYPES = new Set([0, 4, 5, 9, 11])
const PRIVILEGED_SID_STRINGS = ['S-1-5-18', 'S-1-5-32-544']

let cachedWin32Api = null

function loadWin32SecurityApi() {
  if (cachedWin32Api) return cachedWin32Api
  const kernel32 = koffi.load('kernel32.dll')
  const advapi32 = koffi.load('advapi32.dll')
  const SID_AND_ATTRIBUTES = koffi.struct('SignatureCacheSidAndAttributes', { Sid: 'void *', Attributes: 'uint32' })
  const ACL_SIZE_INFO = koffi.struct('SignatureCacheAclSizeInfo', { AceCount: 'uint32', AclBytesInUse: 'uint32', AclBytesFree: 'uint32' })
  const ACE_HEADER = koffi.struct('SignatureCacheAceHeader', { AceType: 'uint8', AceFlags: 'uint8', AceSize: 'uint16' })
  cachedWin32Api = {
    GetCurrentProcess: kernel32.func('void * __stdcall GetCurrentProcess()'),
    CloseHandle: kernel32.func('bool __stdcall CloseHandle(void *)'),
    LocalFree: kernel32.func('void * __stdcall LocalFree(void *)'),
    GetDriveTypeW: kernel32.func('uint32 __stdcall GetDriveTypeW(str16)'),
    GetFileAttributesW: kernel32.func('uint32 __stdcall GetFileAttributesW(str16)'),
    OpenProcessToken: advapi32.func('bool __stdcall OpenProcessToken(void *, uint32, _Out_ void **)') ,
    GetTokenInformation: advapi32.func('bool __stdcall GetTokenInformation(void *, int32, _Out_ uint8 *, uint32, _Out_ uint32 *)'),
    ConvertStringSidToSidW: advapi32.func('bool __stdcall ConvertStringSidToSidW(str16, _Out_ void **)') ,
    GetLengthSid: advapi32.func('uint32 __stdcall GetLengthSid(void *)'),
    EqualSid: advapi32.func('bool __stdcall EqualSid(void *, void *)'),
    InitializeAcl: advapi32.func('bool __stdcall InitializeAcl(uint8 *, uint32, uint32)'),
    AddAccessAllowedAceEx: advapi32.func('bool __stdcall AddAccessAllowedAceEx(uint8 *, uint32, uint32, uint32, void *)'),
    SetNamedSecurityInfoW: advapi32.func('uint32 __stdcall SetNamedSecurityInfoW(str16, int32, uint32, void *, void *, uint8 *, void *)'),
    GetNamedSecurityInfoW: advapi32.func('uint32 __stdcall GetNamedSecurityInfoW(str16, int32, uint32, _Out_ void **, void *, _Out_ void **, void *, _Out_ void **)') ,
    GetAclInformation: advapi32.func('bool __stdcall GetAclInformation(void *, _Out_ uint8 *, uint32, int32)'),
    GetAce: advapi32.func('bool __stdcall GetAce(void *, uint32, _Out_ void **)') ,
    decodeTokenUserSid: (buf) => koffi.decode(buf, SID_AND_ATTRIBUTES).Sid,
    decodeAclSize: (buf) => koffi.decode(buf, ACL_SIZE_INFO),
    decodeAceHeader: (ptr) => koffi.decode(ptr, ACE_HEADER),
    decodeAceBytes: (ptr, size) => koffi.decode(ptr, 'uint8', size),
  }
  return cachedWin32Api
}

function assertSafeLocalDirectoryPath(api, rawPath) {
  const fullPath = resolve(rawPath)
  if (!/^[A-Za-z]:\\/.test(fullPath) || !/^[A-Za-z]:[\\/]/.test(rawPath)) {
    throw new Error('Signature cache requires an absolute local drive path')
  }
  const driveRoot = `${fullPath.slice(0, 2)}\\`
  if (api.GetDriveTypeW(driveRoot) !== DRIVE_FIXED) {
    throw new Error('Signature cache requires a fixed local drive')
  }
  let probe = fullPath
  while (true) {
    const attrs = api.GetFileAttributesW(probe) >>> 0
    if (attrs !== INVALID_FILE_ATTRIBUTES && (attrs & FILE_ATTRIBUTE_REPARSE_POINT) !== 0) {
      throw new Error('Signature cache cannot use reparse points in its path')
    }
    const parent = win32.dirname(probe)
    if (parent === probe) break
    probe = parent
  }
  return fullPath
}

function readCurrentUserToken(api) {
  const tokenOut = [null]
  if (!api.OpenProcessToken(api.GetCurrentProcess(), TOKEN_QUERY, tokenOut) || !tokenOut[0]) {
    throw new Error('Failed to open current Windows process token')
  }
  const tokenHandle = tokenOut[0]
  const requiredLen = [0]
  api.GetTokenInformation(tokenHandle, TOKEN_USER, null, 0, requiredLen)
  const bufSize = Math.max(requiredLen[0] || 0, 128)
  const tokenBuf = Buffer.alloc(bufSize)
  const outLen = [0]
  if (!api.GetTokenInformation(tokenHandle, TOKEN_USER, tokenBuf, bufSize, outLen)) {
    api.CloseHandle(tokenHandle)
    throw new Error('Failed to query current Windows user SID')
  }
  return { tokenHandle, tokenBuf, userSid: api.decodeTokenUserSid(tokenBuf) }
}

function buildPrivateDacl(api, sids) {
  const aclSize = 8 + sids.reduce((total, sid) => total + 8 + api.GetLengthSid(sid), 0)
  const aclBuf = Buffer.alloc(aclSize)
  if (!api.InitializeAcl(aclBuf, aclSize, ACL_REVISION)) {
    throw new Error('Failed to initialize Windows signature cache ACL')
  }
  const inheritFlags = CONTAINER_INHERIT_ACE | OBJECT_INHERIT_ACE
  for (const sid of sids) {
    if (!api.AddAccessAllowedAceEx(aclBuf, ACL_REVISION, inheritFlags, FILE_ALL_ACCESS, sid)) {
      throw new Error('Failed to populate Windows signature cache ACL')
    }
  }
  return aclBuf
}

function assertPrivateSecurity(api, fullPath, currentUserSid, allowedSids, enforcePrivateDacl) {
  const pOwner = [null]
  const pDacl = [null]
  const pSd = [null]
  const rc = api.GetNamedSecurityInfoW(
    fullPath,
    SE_FILE_OBJECT,
    OWNER_SECURITY_INFORMATION | DACL_SECURITY_INFORMATION,
    pOwner,
    null,
    pDacl,
    null,
    pSd,
  )
  if (rc !== 0) {
    throw new Error(`Failed to read Windows signature cache permissions (Win32 error ${rc})`)
  }
  try {
    if (!pOwner[0] || !api.EqualSid(pOwner[0], currentUserSid)) {
      throw new Error('Signature cache directory must belong to the current Windows account')
    }
    if (!enforcePrivateDacl) return
    if (!pDacl[0]) {
      throw new Error('Signature cache permissions must exclude other ordinary Windows accounts')
    }
    const sizeBuf = Buffer.alloc(12)
    if (!api.GetAclInformation(pDacl[0], sizeBuf, 12, ACL_SIZE_INFORMATION)) {
      throw new Error('Failed to inspect Windows signature cache ACL')
    }
    const { AceCount } = api.decodeAclSize(sizeBuf)
    for (let i = 0; i < AceCount; i += 1) {
      const pAce = [null]
      if (!api.GetAce(pDacl[0], i, pAce) || !pAce[0]) {
        throw new Error('Failed to inspect Windows signature cache ACE')
      }
      const header = api.decodeAceHeader(pAce[0])
      if (!ALLOW_ACE_TYPES.has(header.AceType)) continue
      if (header.AceType !== ACCESS_ALLOWED_ACE_TYPE) {
        throw new Error('Signature cache permissions must exclude other ordinary Windows accounts')
      }
      const rawAce = api.decodeAceBytes(pAce[0], header.AceSize)
      const aceSid = rawAce.subarray(8)
      if (!allowedSids.some((sid) => api.EqualSid(aceSid, sid))) {
        throw new Error('Signature cache permissions must exclude other ordinary Windows accounts')
      }
    }
  } finally {
    if (pSd[0]) api.LocalFree(pSd[0])
  }
}

function readCurrentOwnerSid(api, fullPath) {
  const pOwner = [null]
  const pSd = [null]
  const rc = api.GetNamedSecurityInfoW(fullPath, SE_FILE_OBJECT, OWNER_SECURITY_INFORMATION, pOwner, null, null, null, pSd)
  if (rc !== 0) {
    throw new Error(`Failed to read Windows signature cache owner (Win32 error ${rc})`)
  }
  return { pOwner: pOwner[0], pSd: pSd[0] }
}

export async function prepareWindowsSignatureCacheDirectory(path, existingSource = false) {
  if (process.platform !== 'win32') throw new Error('Windows signature cache directory validation requires Windows')
  const api = loadWin32SecurityApi()
  const fullPath = assertSafeLocalDirectoryPath(api, path)
  const targetAttrs = api.GetFileAttributesW(fullPath) >>> 0
  let created = false
  if (targetAttrs !== INVALID_FILE_ATTRIBUTES) {
    if ((targetAttrs & FILE_ATTRIBUTE_DIRECTORY) === 0) {
      throw new Error('Signature cache path must be a directory')
    }
  } else {
    if (existingSource) {
      throw new Error('Signature cache migration source does not exist')
    }
    await mkdir(fullPath, { recursive: true })
    created = true
  }

  const { tokenHandle, tokenBuf, userSid } = readCurrentUserToken(api)
  void tokenBuf
  const nativeSids = []
  try {
    for (const sidText of PRIVILEGED_SID_STRINGS) {
      const outSid = [null]
      if (!api.ConvertStringSidToSidW(sidText, outSid) || !outSid[0]) {
        throw new Error(`Failed to parse Windows SID ${sidText}`)
      }
      nativeSids.push(outSid[0])
    }
    const allowedSids = [userSid]
    for (const sid of nativeSids) {
      if (!allowedSids.some((existing) => api.EqualSid(existing, sid))) {
        allowedSids.push(sid)
      }
    }
    if (created) {
      const aclBuf = buildPrivateDacl(api, allowedSids)
      const ownerInfo = readCurrentOwnerSid(api, fullPath)
      let needsOwnerUpdate = false
      try {
        needsOwnerUpdate = !ownerInfo.pOwner || !api.EqualSid(ownerInfo.pOwner, userSid)
      } finally {
        if (ownerInfo.pSd) api.LocalFree(ownerInfo.pSd)
      }
      const secInfo = ((needsOwnerUpdate ? OWNER_SECURITY_INFORMATION : 0) | DACL_SECURITY_INFORMATION | PROTECTED_DACL_SECURITY_INFORMATION) >>> 0
      const setRc = api.SetNamedSecurityInfoW(fullPath, SE_FILE_OBJECT, secInfo, needsOwnerUpdate ? userSid : null, null, aclBuf, null)
      if (setRc !== 0) {
        throw new Error(`Failed to set Windows signature cache permissions (Win32 error ${setRc})`)
      }
    }
    assertPrivateSecurity(api, fullPath, userSid, allowedSids, !existingSource)
  } finally {
    for (const sid of nativeSids) api.LocalFree(sid)
    api.CloseHandle(tokenHandle)
  }

  if ((await realpath(fullPath)).toLowerCase() !== fullPath.toLowerCase()) {
    throw new Error('Signature cache directory is redirected; configure DSH_DESKTOP_WINDOWS_SIGNATURE_CACHE_DIR outside redirected storage')
  }
}
