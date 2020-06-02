/* eslint-disable */

/**
 * 用与测试插件是否生效,不要在生产环境使用
 * @param {} path Program Path
 */
function enEffect(path,t) {
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

// TODO: 普通变量无法更改
/**
 * 是否初次处理用户配置
 */
let configs = {
    isHandleCustomNOTransformSet : false
}

module.exports = (babel) => {
    const { types: t } = babel;

    let isInsert = false
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

    function createTransformCallExpression(argExp) {
        const call = t.callExpression(
            t.Identifier('__d_'),
            [
                argExp,
                t.Identifier(
                    String(transformUnit)
                ),
                !configs.isHandleCustomNOTransformSet ? t.ArrayExpression(
                    customNoTransformSet.map(r => t.StringLiteral(r))
                ) : t.nullLiteral()
            ]
        );

        if(!configs.isHandleCustomNOTransformSet) configs.isHandleCustomNOTransformSet = true
        return call
    }
	
  	/**
    	{a:1} 
        ---------transform--------
        {
        	style: {
            	a:1
            }
        }
    */
  	function createStyleWrapExp(inner) {
      	let wrap = t.objectProperty(
        	t.StringLiteral('__inner'),
          	inner
        )
    	let result = t.objectExpression(
        	[
            	wrap
            ]
        )

        return result
    }
    
    function getProgram(path) {
        return path.findParent(p => 
            t.isProgram(p)
        )
    }

    function buildTransformImport() {
        const addedImport = t.ImportDeclaration(
            [t.ImportDefaultSpecifier(t.Identifier('__d_'))],
            // 理论上来说,这个名字应该由用户配置更加方便扩展
            t.StringLiteral('@tencent/babel-plugin-rnplus-px2rem/lib/transform')
        );

        return addedImport
    }

    function insertTransformImportAfterSSImport(path) {
        if(isInsert) return
        if(!path.parentPath) throw new Error('path is not ImportSpecifier')
        const addedImport = buildTransformImport()
        const faPath = path.parentPath
        faPath.insertAfter(addedImport)

        isInsert = true
    }

    function insertTransformImportOnTop(path) {
        if(isInsert) return
        if(!topPath) topPath = getProgram(path)

        topPath.node.body.unshift(buildTransformImport())
        isInsert = true

    }

    return {
        name: 'babel-plugin-rnplus-px2rem',
    	visitor: {
            ImportSpecifier(path) {
                if(path.node.imported.name === 'StyleSheet') {
                  ssName = path.node.local.name
                  insertTransformImportAfterSSImport(path)         	
                }
            },
          	JSXAttribute(path,{inlineTransform=false}) {
                if(inlineTransform) return
                
              	let value
            	if(t.isJSXIdentifier(path.get('name')) && path.node.name.name === 'style') {
                    insertTransformImportOnTop(path)
                	if(t.isJSXExpressionContainer((value = path.get('value')))) {
                      	let exp
                    	if(t.isObjectExpression((exp = value.get('expression')))) {
                        	// let wrapStyle = createStyleWrapExp(exp.node)
                            const realStyleExp = createTransformCallExpression(exp.node)
                            exp.replaceWith(realStyleExp)
                        }
                    }
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
                            throw new Error(`
                                babel-plugin-px2rem option:noTransform only accept array stringliteral
                                like this: "[\"fontSize,height\"]"
                            `)
                        }
                    }
                    else customNoTransformSet = []
                }

                transformUnit || (transformUnit = state.opts['unit'] ) || 1 / 37.5

                topPath = getProgram(path)

                if(!checkIsSS(path)) return 
                let topScope = findVariableTopScope(path,ssName)

                // 判断ss是否是引用react-native
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