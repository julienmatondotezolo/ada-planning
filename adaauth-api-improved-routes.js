// Improved AdaAuth API routes for Server Components + Cookies support

/**
 * Enhanced /auth/validate endpoint
 * Supports multiple token passing methods for better Server Components integration
 */

// IMPROVED VERSION for VPS deployment
const improvedValidateRoute = `
router.post("/validate", tokenValidationLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    // Support multiple token passing methods for Server Components + Cookies
    const token = 
      req.body.token ||           // Standard: {"token": "..."}
      req.body.access_token ||    // Legacy: {"access_token": "..."}  
      req.headers.authorization?.replace("Bearer ", "") || // Bearer header
      req.cookies?.ada_access_token; // Cookie support for Server Components

    if (!token) {
      res.status(400).json({ 
        error: "MISSING_TOKEN", 
        message: "Access token is required via body.token, body.access_token, Authorization header, or cookie" 
      });
      return;
    }

    console.log('🔍 Token validation request:', { 
      hasToken: !!token, 
      source: req.body.token ? 'body.token' : 
              req.body.access_token ? 'body.access_token' :
              req.headers.authorization ? 'header' : 'cookie',
      userAgent: req.headers['user-agent']?.substring(0, 50)
    });

    // Validate token with Supabase
    const user = await authService.validateToken(token);
    
    if (!user || !user.user) {
      throw new Error('Invalid user data from token validation');
    }

    // Enhanced response format for Server Components
    const responseData = {
      valid: true,
      user: {
        id: user.user.id,
        email: user.user.email,
        first_name: user.user.user_metadata?.first_name,
        last_name: user.user.user_metadata?.last_name,
        full_name: user.user.user_metadata?.full_name,
        role: user.user.user_metadata?.restaurant_role || 'staff',
        restaurant_id: user.user.user_metadata?.restaurant_id || 'c1cbea71-ece5-4d63-bb12-fe06b03d1140',
        active: true,
        // Add token expiration info for client-side refresh logic
        exp: user.user.exp,
        iat: user.user.iat
      },
      // Include token info for debugging  
      token_info: {
        expires_at: user.user.exp ? new Date(user.user.exp * 1000).toISOString() : null,
        issued_at: user.user.iat ? new Date(user.user.iat * 1000).toISOString() : null,
        valid_for_seconds: user.user.exp ? (user.user.exp - Math.floor(Date.now() / 1000)) : null
      }
    };

    console.log('✅ Token validation successful:', {
      userId: responseData.user.id,
      email: responseData.user.email,
      role: responseData.user.role,
      restaurant: responseData.user.restaurant_id,
      expiresIn: responseData.token_info.valid_for_seconds
    });

    res.json(responseData);
    
  } catch (error: any) {
    console.error("❌ Token validation error:", {
      error: error.message,
      stack: error.stack?.split('\\n')[0],
      timestamp: new Date().toISOString()
    });
    
    res.status(401).json({
      valid: false,
      error: "INVALID_TOKEN",
      message: "Token is invalid or expired",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});
`;

// ENHANCED COOKIE SUPPORT
const cookieMiddleware = \`
// Add cookie parser middleware to Express app
import cookieParser from 'cookie-parser';
app.use(cookieParser());

// Enhanced CORS for cookie support
const corsOptions = {
  origin: [
    'https://ada-menu.vercel.app',
    'https://ada-planning.vercel.app', 
    'https://adaauth.mindgen.app',
    'https://adastock.mindgen.app',
    'https://adastaff.mindgen.app',
    'http://localhost:3005' // Development
  ],
  credentials: true, // CRITICAL: Allow cookies in CORS
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
\`;

// LOGOUT ENHANCEMENT with cookie clearing
const improvedLogoutRoute = \`
router.post("/logout", async (req: Request, res: Response): Promise<void> => {
  try {
    const token = 
      req.body.token ||
      req.body.access_token ||
      req.headers.authorization?.replace("Bearer ", "") ||
      req.cookies?.ada_access_token;

    if (token) {
      try {
        // Attempt to invalidate token with Supabase
        await authService.logout(token);
      } catch (error) {
        console.warn('Token invalidation failed (token may already be invalid):', error.message);
      }
    }

    // Clear cookie regardless of token validation result
    res.clearCookie('ada_access_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });

    console.log('✅ Logout successful, cookie cleared');

    res.json({
      message: "Logout successful",
      cleared_cookie: true
    });
    
  } catch (error: any) {
    console.error("Logout error:", error);
    
    // Still clear cookie even on error
    res.clearCookie('ada_access_token');
    
    res.status(500).json({
      error: "LOGOUT_ERROR",
      message: "Logout failed but cookie cleared",
      cleared_cookie: true
    });
  }
});
\`;

console.log("AdaAuth API improvements ready for deployment");
console.log("Key changes:");
console.log("1. Support multiple token sources (body.token, body.access_token, header, cookie)");
console.log("2. Enhanced response with user data for Server Components");
console.log("3. Better logging and debugging");
console.log("4. Improved logout with cookie clearing");
console.log("5. CORS credentials support for cookies");