import { test as base } from "@playwright/test";
import fs from "fs";
import path from "path";

import { resetDatabaseForTest } from "./test-db";

export const test = base.extend({});

test.beforeEach(async () => {
  await resetDatabaseForTest();
});
