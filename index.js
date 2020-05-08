/* eslint-disable */

module.exports = (babel) => {
    const { types: t } = babel;

    let topPath
    let ssName 
    let customNoTransformSet

    let transformUnit
    function checkIsSS(cePath) {
        if(t.isMemberExpression(cePath.node.callee)) {
          const { object, property } = cePath.node.callee 
          if(
            object && 
            property &&
            object.name === ssName &&
            property.name === 'create'
          ) {
            return true
          }
        }
    }

    function findVariableTopScope(path,name) {
        let { scope } = path
        while(scope && !scope.hasOwnBinding(name)) {
          scope = scope.parent
        }

        return scope
    }

    function coreHandleVariable(curArg,path) {
        path.get('arguments')[0].replaceWith(
            createTransformCallExpression(curArg)
        )
    }

    /**
     * 用与测试插件是否生效,不要在生产环境使用
     * @param {} path Program Path
     */
    function enEffect(path) {
        const co = t.ExpressionStatement(
            t.CallExpression(
                t.MemberExpression(
                    t.Identifier('console'),
                    t.Identifier('log')
                ),
                [t.Identifier('123')]
            )
        )
        path.node.body.unshift(co)
    }

    function createTransformCallExpression(argExp,customNoTransforms) {

        const call = t.callExpression(
            t.Identifier('__d_'),
            [
                argExp,
                t.Identifier(
                    String(transformUnit)
                ),
                t.ArrayExpression(
                    customNoTransformSet.map(r => t.StringLiteral(r))
                )
            ]
        );
        return call
    }

    return {
        name: 'babel-plugin-px2rem',
    	visitor: {
          	Program(path) {
            	const addedImport = t.ImportDeclaration(
                	[t.ImportDefaultSpecifier(t.Identifier('__d_'))],
                  	t.StringLiteral('px2rem/transform')
                );

                // enEffect(path)
                path.node.body.unshift(addedImport);
            },
            ImportSpecifier(path) {
                if(path.node.imported.name === 'StyleSheet') {
                  ssName = path.node.local.name           	
                }
            },
        	CallExpression(path,state) {
                if(!customNoTransformSet) {
                    let noSet
                    if((noSet = state.opts['noTransform'])) {
                        try {
                            noSet = JSON.parse(noSet)
                            if(!noSet.pop) throw new Error()

                            customNoTransformSet = noSet
                        } catch(e) {
                            throw new Error('@babel/plugin-px2rem option:noTransform only accept array stringliteral')
                        }
                    }
                    else customNoTransformSet = []
                }

                transformUnit || (transformUnit = state.opts['unit'] ) || 1 / 37.5

                topPath = path.findParent(path => t.isProgram(path))

                if(!checkIsSS(path)) return 
                let topScope = findVariableTopScope(path,ssName)

                if(topScope === topPath.scope) {
                    let curArgs = path.node.arguments[0]
                    
                    // 不处理非对象或变量形式的参数
                    // 因为不确定rn-web是否对其他格式的参数有所支持
                    if(t.isIdentifier(curArgs) || t.isObjectExpression(curArgs)){
                        coreHandleVariable(curArgs,path)
                    }
                }
            }
        }
    };
};