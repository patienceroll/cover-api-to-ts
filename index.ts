import fs from "fs/promises";
import path from "path";

const map = new Map<string, Sechma>();

function parse(file: string, path: string) {
  fs.readFile(file).then((res) => {
    const json: OpenApi = JSON.parse(res.toString("utf-8"));

    Object.keys(json.components.schemas).forEach((key) => {
      const JsonSechma = json.components.schemas[key];
      // 先判断此 sechma 是否因为被其他 sechma 引用已经生成了
      const mapSechma = map.get(key);
      if (mapSechma) return;

      function generateSechmaIntoMap(jsonSechma: Sechma, sechmaName: string) {
        const newSechma: Sechma = {};
        newSechma.title = jsonSechma.title;
        newSechma.type = jsonSechma.type;
        newSechma.description = jsonSechma.description;
        newSechma.required = jsonSechma.required;
        function generateProperty() {
          if (jsonSechma.$ref) {
            const sem = map.get(refName(jsonSechma.$ref));
            if (sem) {
              // 引用的 sechma 不会有ref,且一定是个对象
              newSechma.properties = sem;
            } else {
              const data = json.components.schemas[refName(jsonSechma.$ref)];
              generateSechmaIntoMap(data, refName(jsonSechma.$ref));
              newSechma.properties = map.get(refName(jsonSechma.$ref));
            }
          } else if(jsonSechma.properties) {
              // 没有引用,此时一定是  [key: string]: Sechma;
              
          }
        }

        map.set(sechmaName, newSechma);
      }
    });
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
