// 使用koa   根据类型自定义日志输入对应的日志文件中
const Koa = require('koa');
const fs = require('fs');
const route = require('koa-route');
const app = new Koa();
const {format} = require('date-fns');
const date = new Date();

//获取当前时间
function getFileName() {
    const date = new Date();
    let year = date.getFullYear();
    let month = date.getMonth() + 1;
    let day = date.getDate();
    if (month < 10) {
        month = "0" + month;
    }
    if (day < 10) {
        day = "0" + day;
    }
    return year + "-" + month + "-" + day;
}

// 处理主要的日志的主要信息
function getMessage(ctx) {
    // 获取浏览器信息
    const agent = ctx.request.header['user-agent'];
    const host = ctx.request.header.host;
    const method = ctx.request.method;
    const url = ctx.request.url;
    return host + '     ' + method + '     ' + url + '     ' + agent;
}


// 计划根据 code或者status区分类型  INFO(默认)  WARN  ERROR
function handleLogger(ctx, code) {
    // loggerType  用来区分类型的写入和文件也是区分开的
    let loggerType = '';
    if (code === 200) {
        loggerType = 'INFO';
    } else if (code > 200 || code < 10001) {
        loggerType = 'WARN';
    } else {
        loggerType = 'ERROR';
    }
    // logger目录位置  // 这个根据项目需要使用cwd最好  const LOGGER_PATH = path.resolve(process.cwd(), 'loggers');
    // ,这里demo我就写相对路径了

    const LOGGER_PATH = './loggers';
    // 目录不存在则创建目录
    if (!fs.existsSync(LOGGER_PATH)) {
        fs.mkdirSync(LOGGER_PATH);
    }

    let message = getMessage(ctx);
    // 文件名,使用日期作为文件名 比如  INFO_2020-03-17.log
    let fileName = `${LOGGER_PATH}/${loggerType}_${getFileName()}.log`;
    // 需要写入的日志信息  比如[2020-03-17 17:27:01]     [INFO]     localhost:9898     GET     /     Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.132 Safari/537.36+
    let loggerContent = `[${format(new Date(), 'yyy-MM-dd HH:mm:ss')}]     [${loggerType}]     ${message}+ \n`;
    fs.readFile(fileName, (err, data) => {
        if (err) {
            //  读取的文件不存在,创建文件
            fs.writeFile(fileName, loggerContent, error => {
                if (error) return console.log("写入文件失败,原因是" + error.message);
                // 同时输出log
                console.log(loggerContent);
            });
        } else {
            //  fs.writeFile 没有该文件则创建  但是会覆盖原来有的内容,所以需要获取原有数据并作追加
            fs.writeFile(fileName, data + loggerContent, error => {
                if (error) return console.log("写入文件失败,原因是" + error.message);
                // 同时输出log
                console.log(loggerContent);
            });
        }
    });
}

const main = ctx => {
    handleLogger(ctx, 200);
    ctx.response.body = 'Hello World';
};
const about = ctx => {
    ctx.response.body = 'Hello World';
    handleLogger(ctx, 10001);
};

app.use(route.get('/', main));
app.use(route.get('/about', about));

app.listen(9898);


// gitHub地址 :  https://github.com/peterbooy/my-logger
