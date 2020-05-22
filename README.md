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

#### 不转换属性
你可以在属性后面添加`!`,此时插件将不会对该属性做转换.

```
{'height!': 80}
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

#### inlineTransform

内联样式存在性能问题,应该使用`StyleSheet.create`来创建样式表

但有些属性不应该被插件转换,你可以把不需要插件转换的属性写在内联样式里面.

默认为`false`,即不转换内联样式.你也可以显式配置为`true`,以应对开发环境.

### 原理
插件本身处理了每一个`stylesheet.create`创建的样式表,使其在被`rn-web`接管前就已经转换为`rem`