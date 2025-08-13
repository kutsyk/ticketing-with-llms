const DEV_ALLOWED = 'http://localhost:4200'

export default function withCORS(handler, options = {}) {

  return async (req, res) => {

    res.headers.set('Access-Control-Allow-Origin', DEV_ALLOWED)
    res.headers.set('Access-Control-Allow-Credentials', 'true')
    res.headers.set('Vary', 'Origin')
    return handler(req, res);
  };
}

export const config = {
  matcher: '/api/:path*',
};
