# Minilan 解释器

## Getting Started

在安装有 Node.js 环境下, 输入以下命令运行
```shell
node Runtime.js
```

源代码默认为 `test.mini` 文件. 如需修改, 在 `Term.cpp` 中修改, 并用 g++ 重新编译生成 `a.out`文件.

其中, `Read`函数读取`input.txt`里的内容, 每个输入内容之间用空格分割. 

`Print`函数写入`output.txt`内, 每个输出内容之间用空格分割.

## 测试文件说明

1. fact.mini
    *  输入: 变量 x
    *  输出: x!
    *  测试内容: 基本语法(函数声明与返回值, 函数调用, 循环, 输入/输出等)
2. innerFact.mini
    *  输入: 变量 x
    *  输出: x!
    *  测试内容: 嵌套函数
3. recurFact.mini
    *  输入: 变量 x
    *  输出: x!
    *  测试内容: 递归调用(递归后直接 Return)
4. recurFact2.mini
    *  输入: 变量 x
    *  输出: x!
    *  测试内容: 递归调用作用域(在递归后继续运行)
5. highOrderFunc.mini
    *  输入: 无
    *  输出: 19
    *  测试内容: 高阶函数(函数作为参数)