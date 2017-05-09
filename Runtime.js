const fs = require('fs');
const term = require('./build/Release/term.node');

// Debug Mode, 是否输出运行状态
const debugMode = 1;

// 源代码地址
const source = "./Test/fact.mini";
// 读入 input 内容, 并分割好留待使用
const inputString = fs.readFileSync("./input.txt").toString().split(/\s/);
// 模拟文件指针进行文件读取
let globalInputCount = 0;
// 创建 output 文件
fs.writeFileSync("./output.txt", "");

/**
 * 符号表
 */
let kind = ["Block", "Function", "Command", "Expr", "BoolExpr", "Name"];
let subType = ["Declaration", "Assign", "Read", "Print", "Return", "If", "While", "Call", "Number", "VarName",
    "Plus", "Minus", "Mult", "Div", "Mod", "Apply", "Lt", "Gt", "Eq", "And", "Or", "Negb"];

/**
 * 数据结构定义, 包括语法树, 作用域, 函数上下文
 */
let Term = function (kind, subType, value) {
    this.kind = kind;
    this.subType = subType;
    this.children = [];
    this.value = value;
    this. father = null;
};
let Environment = function (outerLink) {
    this.outerLink = outerLink;
    this.variables = {};
    this.returnValue = null;
};
let func = function (root, env, params, name) {
    this.root = root;
    this.env = env;
    this.params = params;
    this.reference = 1;
    this.name = name;
};

/**
 * 调用提供的语法分析程序, 输出语法树
 */
const transAST = function () {
    const AST = term.parse(source);
    let words = AST.toString().split(/\s/);
    let ASTWords = null;
    words.forEach((element, key) => {
        if (element === "TransStart") {
            ASTWords = words.slice(key+1);
        }
    });
    ASTWords = ASTWords.filter((element) => {
        if (element !== "") {
            return true;
        }
    });
    return ASTWords;
};
/**
 * 递归调用, 重新生成 JS 格式的 Term
 * @param termString 对象,只含有一个 string 属性, 用此方式进行传引用(string 默认传值)
 * @param father 父节点, 根节点为 null
 */
const generateAST = function (termString, father) {
    let root = new Term(kind[termString.stringValue[0]], subType[termString.stringValue[1]], termString.stringValue[2]);
    root.father = father;
    termString.stringValue = termString.stringValue.slice(3);
    if (termString.stringValue[0] === "ChildStart") {
        termString.stringValue = termString.stringValue.slice(1);
        while (termString.stringValue[0] !== "ChildEnd") {
            root.children.push(generateAST(termString, root));
        }
        termString.stringValue = termString.stringValue.slice(1);
        return root;
    } else {
        return root;
    }

};

/**
 * 生成语法树,根节点 root, 全局环境 globalEnv
 */
let obj = {};
obj.stringValue = transAST();
let root = generateAST(obj, null);
let globalEnv = new Environment(null);

/**
 * 工具函数集合
 */
/**
 * 查找变量值 / 函数上下文
 * @param name 要查找的变量名/函数名
 * @param env 作用域
 * @returns {*} 返回变量值/函数上下文
 */
const lookupVariableValue = function (name, env) {
    let current = env;
    while (current !== null) {
        if (current.variables[name]) {
            if (typeof current.variables[name] === "object") {
                // 返回函数
                return current.variables[name];
            } else {
                // 返回变量
                return Number(current.variables[name]);
            }
        } else {
            current = current.outerLink;
        }
    }
};
/**
 * 查找函数名
 * @param name 要查找的函数名
 * @param env 作用域
 * @returns {*} 返回函数名所在的作用域
 */
const lookupVariableKey = function (name, env) {
    let current = env;
    while (current !== null) {
        if (Object.keys(current.variables).includes(name)) {
            return current;
        } else {
            current = current.outerLink;
        }
    }
};
/**
 * 执行 expr 运算
 * @param root 要运算的Term
 * @param env 作用域
 * @returns {*} 返回结果
 */
const expr = function (root, env) {
    switch (root.subType) {
        case "VarName":
            return lookupVariableValue(root.value, env);
            break;
        case "Number":
            return Number(root.value);
            break;
        case "Plus":
            return expr(root.children[0], env) + expr(root.children[1], env);
            break;
        case "Minus":
            return expr(root.children[0], env) - expr(root.children[1], env);
            break;
        case "Mult":
            return expr(root.children[0], env) * expr(root.children[1], env);
            break;
        case "Div":
            return expr(root.children[0], env) / expr(root.children[1], env);
            break;
        case "Mod":
            return expr(root.children[0], env) % expr(root.children[1], env);
            break;
        case "Apply":
            if (debugMode) {
                console.log("Call Function: " + root.children[0].value);
            }
            // 函数调用, 生成作用域
            let runningFunction = newFunctionScope(lookupVariableValue([root.children[0].value], env));
            let i = 1;
            runningFunction.params.forEach((para) => {
                runningFunction.env.variables[para] = expr(root.children[i++], env);
            });
            exec(runningFunction);
            // 检测返回值, 如果不是函数, 销毁作用域
            let returnValue = runningFunction.env.returnValue;
            if (typeof returnValue !== "object") {
                free(root.children[0].value, runningFunction);
            }
            return returnValue;
            break;
        default:
            console.log("ERROR");
            break;
    }
};
/**
 * 执行 boolexpr 运算
 * @param root 要运算的Term
 * @param env 作用域
 * @returns {boolean}
 */
const boolexpr = function (root, env) {
    switch (root.subType) {
        case "Lt":
            return expr(root.children[0], env) < expr(root.children[1], env);
            break;
        case "Gt":
            return expr(root.children[0], env) > expr(root.children[1], env);
            break;
        case "Eq":
            return expr(root.children[0], env) === expr(root.children[1], env);
            break;
        case "Negb":
            return !boolexpr(root.children[0], env);
            break;
        case "And":
            boolexpr(root.children[0], env) && boolexpr(root.children[1], env);
            break;
        case "Or":
            boolexpr(root.children[0], env) || boolexpr(root.children[1], env);
            break;
    }
};
/**
 * 函数执行前, 建立作用域
 * @param funcName 要执行的函数上下文
 * @returns {{}} 返回新建的作用域
 */
const newFunctionScope = function (funcName) {
    let obj = {};
    obj.root = funcName.root;
    obj.params = funcName.params;
    obj.env = new Environment(funcName.env.outerLink);
    return obj;
};
/**
 * 执行函数, 用于 Call, Apply, If, While
 * @param func 要执行的 Block 节点
 */
const exec = function (func) {
    let root = func.root;
    let env = func.env;
    for (let i = 0; i < root.children.length; i++) {
        let child = root.children[i];
        // 顺序执行语句
        interpret(child, env);
        // 返回值不为空, 说明执行了一条 Return 语句, 中断剩下语句执行
        if (env.returnValue !== null) {
            return;
        }
    }
};
/**
 * 释放作用域
 */
const free = function (funcName, funcTerm, refer) {
    if (debugMode) {
        if (refer === 1) {
            // 引用归零, 销毁函数
            console.log("Reference become 0. Function " + funcName + " has been collected.");
        } else {
            // 函数运行结束, 销毁作用域
            console.log("Free Function " + funcName);
        }
    }
    funcTerm = null;
};

/**
 * 主逻辑, 负责函数声明/命令执行
 * @param root 要执行的指令节点
 * @param env 作用域
 */
const interpret = function (root, env) {
    let variableName = null;
    let variableEnv = null;

    let boolResult = null;
    let newEnv = null;
    let newFunc = null;
    if (root.kind === "Command") {
        switch (root.subType) {
            case "Declaration":
                // 默认值0
                root.children.forEach((child) => {
                    env.variables[child.value] = 0;
                });
                break;
            case "Assign":
                // 获取变量所在的作用域(左值)
                variableName = root.children[0].value;
                variableEnv = lookupVariableKey(variableName, env);
                // 检测被赋值变量是否是函数, 是函数则引用减少
                if (typeof variableEnv.variables[variableName] === "object") {
                    variableEnv.variables[variableName].reference--;
                    if (debugMode) {
                        console.log("Function " + variableEnv.variables[variableName].name + " has been dereferred. Reference = " + variableEnv.variables[variableName].reference);
                    }
                    // 检测引用是否为0, 为0则释放
                    if (variableEnv.variables[variableName].reference === 0) {
                        free(variableName, variableEnv.variables[variableName], 1);
                    }
                }

                // 赋值操作
                variableEnv.variables[variableName] = expr(root.children[1], env);

                // 检测赋值后是否是函数, 是函数则引用递加
                if (typeof variableEnv.variables[variableName] === "object") {
                    variableEnv.variables[variableName].reference++;
                    if (debugMode) {
                        console.log("Function " + variableEnv.variables[variableName].name + " has been referred. Reference = " + variableEnv.variables[variableName].reference);
                    }
                }
                break;
            case "Call":
                if (debugMode) {
                    console.log("Call Function: " + root.children[0].value);
                }
                // 函数调用, 创建作用域
                let runningFunction = newFunctionScope(lookupVariableValue([root.children[0].value], env));
                let i = 1;
                runningFunction.params.forEach((para) => {
                    runningFunction.env.variables[para] = expr(root.children[i++], env);
                });
                exec(runningFunction);
                // 销毁作用域
                free(root.children[0].value, runningFunction);
                break;
            case "Read":
                variableName = root.children[0].value;
                variableEnv = lookupVariableKey(variableName, env);
                variableEnv.variables[variableName] = inputString[globalInputCount++];
                break;
            case "Print":
                fs.appendFileSync("output.txt", expr(root.children[0], env));
                fs.appendFileSync("output.txt", " ");
                break;
            case "Return":
                env.returnValue = expr(root.children[0], env);
                break;
            case "If":
                boolResult = boolexpr(root.children[0], env);
                if (boolResult) {
                    newFunc = new func(root.children[1], new Environment(env));
                    exec(newFunc);
                } else {
                    newFunc = new func(root.children[2], new Environment(env));
                    exec(newFunc);
                }
                env.returnValue = newFunc.env.returnValue;
                break;
            case "While":
                boolResult = boolexpr(root.children[0], env);
                newEnv = new Environment(env);
                newFunc = new func(root.children[1], newEnv);
                while (boolResult) {
                    exec(newFunc);
                    if (newFunc.env.returnValue !== null) {
                        env.returnValue = newFunc.env.returnValue;
                        return;
                    }
                    boolResult = boolexpr(root.children[0], env);
                }
                break;
            default:
                console.log("ERROR");
                break;
        }
    } else if (root.kind === "Function") {
        let functionName = root.children[0].value;
        let functionEnv = new Environment(env);
        let functionParams = [];
        let i = 1;
        for (i = 1; root.children[i].kind !== "Block"; i++) {
            functionParams.push(root.children[i].value);
            functionEnv.variables[root.children[i].value] = 0;
        }
        env.variables[functionName] = new func(root.children[i], functionEnv, functionParams, functionName);
        if (debugMode) {
            console.log("Function " + functionName +" created. Reference = " + env.variables[functionName].reference);
        }
    }

};

// 开始执行
root.children.forEach((root) => {
    interpret(root, globalEnv);
});