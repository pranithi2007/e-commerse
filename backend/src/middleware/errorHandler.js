/**
 * Central Error Handler Middleware
 */

function errorHandler(err, req, res, next) {
  console.error('[Error]', err.stack || err.message || err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'An unexpected internal server error occurred.';

  if (req.xhr || req.headers.accept?.includes('json') || req.path.startsWith('/api/')) {
    return res.status(statusCode).json({
      success: false,
      error: message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }

  res.status(statusCode).send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Error - DFA Commerce</title>
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    </head>
    <body class="bg-light d-flex align-items-center justify-content-center" style="min-height: 100vh;">
      <div class="card p-4 shadow-sm text-center" style="max-width: 500px;">
        <h2 class="text-danger mb-3">Something Went Wrong</h2>
        <p class="text-muted">${message}</p>
        <a href="/" class="btn btn-primary mt-3">Return to Home</a>
      </div>
    </body>
    </html>
  `);
}

module.exports = errorHandler;
