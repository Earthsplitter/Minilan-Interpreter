const spawn = require('child_process').spawnSync;
const fs = require('fs');

const inputString = fs.readFileSync("./input.txt").toString().split(/\s/);
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
    this.anonymousBlock = [];
};
let func = function (root, env) {
    this.root = root;
    this.env = env;
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
    let ASTWords;
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

//生成语法树
let obj = {};
obj.stringValue = transAST();
let root = generateAST(obj, null);

console.log(root.children[1]);

let globalEnv = new Environment(null);

const lookupVariable = function (name, env) {
    let current = env;
    while (current !== null) {
        if (current.variables[name]) {
            return current.variables[name];
        } else {
            current = current.outerLink;
        }
    }
};
const expr = function (root, env) {
    switch (root.subType) {
        case "VarName":
            return lookupVariable(root.value, env);
            break;
        case "Number":
            return root.value;
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
            break;
    }
};
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
const exec = function () {
    
}

const interpret = function (root, env) {
    if (root.kind === "Command") {
        switch (root.subType) {
            case "Declaration":
                // 默认值0
                env.variables[root.children[0].value] = 0;
                break;
            case "Assign":
                env.variables[root.children[0].value] = expr(root.children[1], env);
                break;
            case "Call":
                break;
            case "Read":
                env.variables[root.children[0].value] = inputString[globalInputCount++];
                break;
            case "Print":
                fs.writeFileSync("output.txt", expr(root.children[0], env));
                break;
            case "If":
                let boolResult = boolexpr(root.children[0], env);
                let newEnv = new Environment(env);
                let newFunc = null;
                if (boolResult) {
                    newFunc = new func(root.children[1], newEnv);
                    exec();
                } else {
                    newFunc = new func(root.children[2], newEnv);
                }
                break;
        }
    }
};

// 开始执行
// root.children.forEach((root) => {
//     interpret(root, globalEnv);
// });
console.log(root.children[2]);