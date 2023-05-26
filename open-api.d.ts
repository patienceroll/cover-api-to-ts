type OpenApi = {
  openapi: string;
  info: {
    title: string;
    description: string;
    termsOfService: string;
    contact: {
      name: string;
      url: string;
      email: string;
    };
    version: string;
  };
  servers: {
    url: string;
    description: string;
  }[];
  paths: {
    [path: string]: Record<"post" | "get" | "delete", PathInstance>;
  };
  components: {
    schemas: {
      [x: string]: Sechma;
    };
  };
};


type PathInstance = {
  tags: string[];
  summary: string;
  operationId: string;
  responses: Record<
    Response["status"],
    {
      content: {
        "*/*": {
          schema: {
            $ref: string;
          };
        };
      };
    }
  >;
};

type DataType =
  | "object"
  | "integer"
  | "array"
  | "string"
  | "number"
  | "boolean";

type Sechma = {
  title?: string;
  type?: DataType;
  description?: string;
  properties?: Sechma;
  required?: string[];
  /** 有ref就说明是一个对象,且没有properties */
  $ref?: string;
  items?: Sechma;
  [key: string]: Sechma;
};
