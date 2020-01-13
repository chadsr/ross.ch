import * as shell from 'shelljs';

shell.cp( '-R', 'src/views/', 'dist/src/' );
shell.cp( '-R', 'src/stylesheets/', 'dist/src/' );
shell.cp( '-R', 'src/assets/', 'dist/src/' );
shell.cp( 'postcss.config.js', 'dist/' );
shell.cp( 'src/views/partials/webpack.hbs', 'dist/src/views/partials/webpack.hbs' );

