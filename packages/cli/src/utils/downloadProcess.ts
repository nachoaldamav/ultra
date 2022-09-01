import { downloadPackage } from "./downloadPackage.js";
import { _downloadSpinner } from "./downloadSpinner.js";

process
  .on(
    "message",
    async (data: {
      name: string;
      version: any;
      location: any;
      path: any;
      resolved: any;
    }) => {
      if (!data.resolved) process.exit();

      await downloadPackage(
        data.resolved,
        data.name,
        data.location,
        data.version
      );
      process.exit();
    }
  )
  .on("error", (error) => {
    console.log(error);
  });
