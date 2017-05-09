# Minilan 解释器

## Getting Started

在安装有 Node.js 环境下, 输入以下命令运行
```bash
npm install -g node-gyp
node-gyp configure
node-gyp build
node Runtime.js
```

1. 第一步安装 node-gyp
2. 第二步根据操作系统生成配置文件 `Makefile` (Unix) 或者 `vcxproj` (Windows)
3. 第三步 Build 生成 `*.node` 模块便于调用
4. 第四步执行测试代码.

源代码地址在 `Runtime.js` 文件中第六行设置.

其中, `Read`函数读取`input.txt`里的内容, 每个输入内容之间用空格分割. 

`Print`函数写入`output.txt`内, 每个输出内容之间用空格分割.

## 主要Feature

基本语法树参考`语法说明.docx`文件.

主要实现了基本的语法和高阶函数功能.

### 高阶函数

1. 函数可以作为参数传递, 例如: *测试文件5*
2. 函数同变量一样, 可以进行赋值等操作, 例如:
```
    Var m End
    Function g Paras z
    Begin
        Return Mult x z
    End
    Assign m g 
```
3. 函数作为返回值返回, 可以 Currying, 例如: *测试文件6*

### 垃圾收集

垃圾主要来自于2个方面:
1. 函数调用结束后回收:
    1. 函数不返回引用(函数闭包): 函数调用只有2个入口: `Call` 和 `Apply`, 在这两个位置调用结束后销毁生成的作用域即可.
    2. 函数返回引用(嵌套函数闭包): 因为函数返回了一个闭包, 因此其作用域必须保存, 不能直接销毁.
2. 引用计数:

    Minilan 语言中, 唯一的的引用类型是函数.
    
    因此对每一个声明的函数增加一个域`reference`追踪引用数, 每次 Assign 检查被赋值的变量的原值和新值, 更新引用值. 当引用为0, 删除该作用域.


## 测试文件说明

1. **fact.mini**
    *  输入: 变量 x
    *  输出: x!
    *  测试内容: 基本语法(函数声明与返回值, 函数调用, 循环, 输入/输出等)
2. **innerFact.mini**
    *  输入: 变量 x
    *  输出: x!
    *  测试内容: 嵌套函数
3. **recurFact.mini**
    *  输入: 变量 x
    *  输出: x!
    *  测试内容: 递归调用(递归后直接 Return)
4. **recurFact2.mini**
    *  输入: 变量 x
    *  输出: x!
    *  测试内容: 递归调用作用域(在递归后继续运行)
5. **highOrderFunc.mini**
    *  输入: 无
    *  输出: 19
    *  测试内容: 高阶函数(函数作为参数)
6. **currying.mini**
    *  输入: 变量 y
    *  输出: y + 3
    *  测试内容: Currying(函数 g = a+b, currying 后新函数 x = 3+b)