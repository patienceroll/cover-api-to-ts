import fs from "fs/promises";
import path from "path";
import ts from "typescript";

const map = new Map<string, Sechma>();

// const sourceFile = ts.createSourceFile(
//   path.resolve(__dirname, "./template.d.ts"),
//   "",
//   {
//     languageVersion: 99,
//   },
//   true
// );
// console.log(sourceFile);
const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });

function parse(file: string, path: string) {
  fs.readFile(file).then((res) => {
    const json: OpenApi = JSON.parse(res.toString("utf-8"));

    // 生成对象数据
    Object.keys(json.components.schemas).forEach((key) => {
      const JsonSechma = json.components.schemas[key];
      // 先判断此 sechma 是否因为被其他 sechma 引用已经生成了
      const mapSechma = map.get(key);
      if (mapSechma) return;

      function generateSechmaIntoMap(jsonSechma: Sechma, sechmaName: string) {
        let newSechma: Sechma = {};
        newSechma.title = jsonSechma.title;
        newSechma.type = jsonSechma.type;
        newSechma.description = jsonSechma.description;
        newSechma.required = jsonSechma.required;

        function generateProperty() {
          if (jsonSechma.$ref) {
            const sem = map.get(refName(jsonSechma.$ref));
            if (sem) {
              // 引用的 sechma 不会有ref,且一定是个对象
              newSechma = sem;
            } else {
              const data = json.components.schemas[refName(jsonSechma.$ref)];
              generateSechmaIntoMap(data, refName(jsonSechma.$ref));
              newSechma = map.get(refName(jsonSechma.$ref)) as Sechma;
            }
          } else if (jsonSechma.properties) {
            // 没有引用,此时一定是  [key: string]: Sechma;
            let newProperties: Sechma = {};
            newProperties.title = jsonSechma.title;
            newProperties.type = jsonSechma.type;
            newProperties.description = jsonSechma.description;
            newProperties.required = jsonSechma.required;
            Object.keys(jsonSechma.properties).forEach((l) => {
              newProperties[l] = {};
              const s = (jsonSechma.properties as Sechma)[l];
              if (s.$ref) {
                const name = refName(s.$ref);
                const m = map.get(name);
                if (m) {
                  newProperties[l] = m;
                } else {
                  const data = json.components.schemas[name];
                  generateSechmaIntoMap(data, name);
                  newProperties[l] = map.get(name) as Sechma;
                }
              } else {
                if (s.type === "array" && s.items?.$ref) {
                  const name = refName(s.items.$ref);
                  const m = map.get(name);
                  if (m) {
                    newProperties[l].properties = m;
                  } else {
                    generateSechmaIntoMap(json.components.schemas[name], name);
                    newProperties.properties = map.get(name);
                  }
                } else {
                  newProperties[l] = s;
                }
              }
            });
            newSechma.properties = newProperties;
          }
        }
        generateProperty();
        map.set(sechmaName, newSechma);
      }

      generateSechmaIntoMap(JsonSechma, key);
    });

    const pathData = json.paths[path];
    Object.values(pathData).forEach((data) => {
      const sechmaName = refName(
        data.responses[200].content["*/*"].schema.$ref
      );
      const sechma = map.get(sechmaName) as Sechma;
      const comment = ts.factory.createJSDocComment(sechma.description);
      const token = ts.factory.createToken(ts.SyntaxKind.TypeKeyword)
      console.log(printer.printNode(ts.EmitHint.Unspecified, token));
    });

    debugger;
  });
}

function paseRef(ref: string) {
  return ref.split("/").filter((i, index) => index !== 0);
}

function refName(ref: string) {
  const arr = paseRef(ref);
  return arr[arr.length - 1];
}

function getDir() {
  const p = path.normalize(process.argv[2]);
  const { root, dir, ext, name } = path.parse(p);
  return path.join(root ? "" : __dirname, dir, name + ext);
}

parse(getDir(), process.argv[3]);
