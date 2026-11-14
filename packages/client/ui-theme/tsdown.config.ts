import { clientBundle } from '../tsdown.client.ts'

export default clientBundle(
  import.meta.dirname,
  ['lib/types/index.js'],
  {
    lib: {
      copy: [{
        from: 'src/styles/{brand-font.css,workbench-fonts.css,montserrat-*.woff2,Montserrat-OFL.txt}',
        to: 'lib/styles',
      }, {
        from: 'src/styles/workbench-fonts/*',
        to: 'lib/styles/workbench-fonts',
      }],
    },
  },
)
