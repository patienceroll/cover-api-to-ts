import ts from "typescript";

export default {
  createJSDocComment() {
    return ts.factory.createJSDocComment();
  },
};
