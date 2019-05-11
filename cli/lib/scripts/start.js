const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const openBrowser = require('../dev-utils/openBrowser');
const createOption = require('../../config/options');
const {watch, unwatch} = require('../dev-utils/watch');

const {
  useValidPort,
  parseUrl
} = require('../dev-utils/devServerUtils');




function printBrowserOpenInfo(urls) {
  console.log(
    `  ${chalk.bold('Local:')}            ${urls.localUrlForTerminal}`
  );
  console.log(
    `  ${chalk.bold('On Your Network:')}  ${urls.lanUrlForTerminal}`
  );

  console.log();
  
}

function createCompiler(webpack, config) {
  let compiler = webpack(config);

  return compiler;
}

function serve(validPort, serverConfig, open=true){
  const webpackConfig = require('../../config/react.config.js').toConfig();

  let {
    port: dfPort,
    host
  } = serverConfig;

  let compiler = createCompiler(webpack, webpackConfig);
  const devServer = new WebpackDevServer(compiler, serverConfig);

  let parsedUrl = parseUrl('http', host, dfPort);
  
  devServer.listen(validPort, host, err => {
    if (err) {
      throw error
    }
    
    // 第一次编译完成
    let isFistTimeCompile = true;
    compiler.hooks.done.tap('done', () => {

      if (isFistTimeCompile && open) {

        console.log();
        console.log(chalk.cyan('opening the browser at: \n'));

        printBrowserOpenInfo(parsedUrl);
        openBrowser(parsedUrl.localUrl);

        isFistTimeCompile = false;

      }

    })

  });

  return devServer;
}



function run(openBrowser) {

  let {
    devServer: {
      port,
      host
    },
    appRoot,
  } = options = createOption();

  return useValidPort(port, host)
  .then(valiPort => serve(valiPort, options.devServer, openBrowser))
  .catch(e=>{
    
    console.log(chalk.cyan('stop launching the dev server.'));
    console.log('because:\n');
    console.log(e);
    
    
    process.exit(0);
  });
  
}

function watchConfig(cb=f=>f) {
  let watcher = watch('configDir', path.join(process.cwd(), 'config'));
  let timer = null;
  watcher.on('change', (path)=>{
    
    clearTimeout(timer);
    timer = setTimeout(() => {
      
      console.log();
      console.log(chalk.bold.green('cause config file changed, try to restart the server...'));
      console.log();
      
      cb(path);   
    }, 500);
  });
}

function restart() {
  return run(false)
}


module.exports = function() {

  process.on('warning', m=>{
    console.log();
    console.log(chalk.yellow('warning on process:'));
    console.log();
    console.log(chalk.yellow.bold(m.message));
  })

  // the server
  let server = null;

  run(true)
  .then(s=>{
    server = s;
  });

  watchConfig(path=>{
    
    if(!server) return;
    server.close();

    process.nextTick(()=>{
      restart()
      .then(s => {
        server = s;
      })
    });

  });

};

// todo
// - APP_ROOT