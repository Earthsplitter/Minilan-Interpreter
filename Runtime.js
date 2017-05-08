const spawn = require('child_process').spawnSync;
const fs = require('fs');

const inputString = fs.readFileSync("./input.txt").toString().split(/\s/);
// 创建文件
fs.writeFileSync("./output.txt", "");

let globalInputCount = 0;

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
let func = function (root, env, params) {
    this.root = root;
    this.env = env;
    this.params = params;
};
let kind = ["Block", "Function", "Command", "Expr", "BoolExpr", "Name"];
let subType = ["Declaration", "Assign", "Read", "Print", "Return", "If", "While", "Call", "Number", "VarName",
                "Plus", "Minus", "Mult", "Div", "Mod", "Apply", "Lt", "Gt", "Eq", "And", "Or", "Negb"];

/**
 * 调用提供的语法分析程序, 输出语法树
 */
const transAST = function () {
    const AST = spawn('./a.out').output;
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
            let runningFunction = newFunctionScope(lookupVariableValue([root.children[0].value], env));
            let i = 1;
            runningFunction.params.forEach((para) => {
                runningFunction.env.variables[para] = expr(root.children[i++], env);
            });
            exec(runningFunction);
            return runningFunction.env.returnValue;
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
                variableName = root.children[0].value;
                variableEnv = lookupVariableKey(variableName, env);
                variableEnv.variables[variableName] = expr(root.children[1], env);
                break;
            case "Call":
                // 函数调用, 创建作用域
                let runningFunction = newFunctionScope(lookupVariableValue([root.children[0].value], env));
                let i = 1;
                runningFunction.params.forEach((para) => {
                    runningFunction.env.variables[para] = expr(root.children[i++], env);
                });
                exec(runningFunction);
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
        env.variables[functionName] = new func(root.children[i], functionEnv, functionParams);
    }

};

// 开始执行
root.children.forEach((root) => {
    interpret(root, globalEnv);
});