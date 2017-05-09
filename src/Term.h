/*Term.h
	为Minilan语言编写的Term类，用于处理程序文件，将其转化为语法树。
	*/

#ifndef TERM_H
#define TERM_H
#include<string>
#include<list>
#include<iostream>
    enum TermKind {
        Block=0,
        Function,
		Command,
		Expr,
		BoolExpr,
		Name,
    };
	enum TermSubtype {
		Declaration=0,Assign=1,Read=2,Print=3,Return=4,If,While,Call,
        Number,VarName,Plus,Minus,Mult,Div,Mod,Apply,
        Lt,Gt,Eq,And,Or,Negb,		
	};
    class Term{
        public:
            TermKind kind;
			TermSubtype subtype;
            Term* father;
            std::list<Term*> sons;
            int number;
            std::string name;
			
            Term(){}
            Term(TermKind kind){this->kind=kind;}
			void print();
			void transToJS(std::string &t);
    };
	Term* parse(std::istream& input,std::string pretext,Term* father,bool NameorExpr);
#endif
