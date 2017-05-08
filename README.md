# Minilan 解释器

## Getting Started

在安装有 Node.js 环境下, 输入以下命令运行
```shell
node Runtime.js
```

源代码默认为 `test.mini` 文件. 如需修改, 在 `Term.cpp` 中修改, 并用 g++ 重新编译生成 `a.out`文件.

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

2. 引用和去引用的过程:


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