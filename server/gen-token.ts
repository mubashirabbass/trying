import { createToken } from "./src/lib/auth";
import fs from "fs";

const token = createToken(1, "admin");
console.log(token);
