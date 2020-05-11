## RNPLUS-PX2REM

#### 为什么使用rnplus-px2rem
`rn-web`本身没有支持web同构的过程中,自动把px适配为rem的能力.`rnplus-px2rem`提供这样的方案,让`stylesheet.create`创建出来的样式在web同构时自动转换为rem

### usage
```
tnpm install -D @tencent/babel-plugin-rnplus-px2rem
```
你需要在`.babelrc`里配置启用:
```
plugins: {
    [
        "@tencent/rnplus-px2rem",
        {
            "unit" : "0.02666"
        }
    ]
}
```

### options

#### unit
插件本身不提供`adapter`的能力.你可以配置转换的`unit`以达到`adapter`的能力.
```
unit: {
    type: number,
    defaults: "0.02666" (1 / 37.5)
}
```
usage: 
```
{
    "unit" : "0.02666"
}
```

#### noTransform
有些属性不应该被`transform`,插件提供了一些内置的不转换的属性:

```
flex,
opacity,
fontWeight,
transform:scaleX,
transform:scaleY,
transform:scale,
transform:perspective
```

你可以通过配置`noTransform`来添加这个不转换表,
需要注意的是,它的格式必须是一个json数组

usage:
```
"noTransform": "[\"fontSize\"]"
```

### 原理
插件本身处理了每一个`stylesheet.create`创建的样式表,使其在被`rn-web`接管前就已经转换为`rem`