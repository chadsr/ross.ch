import * as shell from 'shelljs';

shell.cp('-R', 'src/views/', 'dist/src/');
shell.cp('-R', 'src/stylesheets/', 'dist/src/');
shell.cp('-R', 'src/fonts/', 'dist/src/');
shell.cp('-R', 'src/images/', 'dist/src/');
shell.cp('postcss.config.js', 'dist/');
shell.cp('src/views/partials/webpack.hbs', 'dist/src/views/partials/webpack.hbs');
