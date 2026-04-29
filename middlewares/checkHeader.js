export async function checkHeaderVersion(req, res, next) {
  console.log("Incoming headers:", req.headers);
  const version = req.headers["x-api-version"];

  if (!version) {
    return res.status(400).json({
      status: "error",
      message: "API version header required",
    });
  }

  if (String(version) !== "1") {
    return res.status(400).json({
      status: "error",
      message: "Incorrect API version header",
    });
  }

  next();
}
