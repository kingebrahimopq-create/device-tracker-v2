# Security Hardening Guide

## Overview

This document outlines the security measures implemented in the Device Tracker V2 application.

## Authentication & Authorization

### 1. OAuth 2.0 Implementation

**Implementation:**
- Secure OAuth 2.0 flow with PKCE
- JWT token management
- Secure session cookies

**Security Features:**
- Tokens stored in HTTP-only cookies
- CSRF protection enabled
- Session timeout after 30 minutes of inactivity
- Automatic token refresh

### 2. Role-Based Access Control (RBAC)

**Implementation:**
```typescript
// Three-tier role system
enum UserRole {
  ADMIN = 'admin',      // Full system access
  MANAGER = 'manager',  // Device and user management
  USER = 'user',        // Limited access to assigned devices
}

// Permission checks on every endpoint
const requireAdmin = (user: User) => {
  if (user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN' });
  }
};
```

**Security Features:**
- Granular permission system
- Device-level access control
- Permission expiration support
- Audit trail for permission changes

### 3. Input Validation

**Implementation:**
```typescript
// Use Zod for schema validation
const createDeviceSchema = z.object({
  deviceId: z.string().min(1).max(100),
  name: z.string().min(1).max(255),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  ipAddress: z.string().ip().optional(),
  macAddress: z.string().regex(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/).optional(),
});

// Validate all inputs
const validatedData = createDeviceSchema.parse(input);
```

**Security Features:**
- Type-safe validation
- Prevents injection attacks
- Sanitizes user input
- Validates data formats

## Data Protection

### 1. Encryption

**Implementation:**
- TLS/SSL for all data in transit
- Sensitive data encrypted at rest
- Database encryption enabled

**Security Features:**
- HTTPS only (no HTTP)
- Strong cipher suites (TLS 1.3)
- Certificate pinning for APIs
- Encrypted database backups

### 2. Password Security

**Implementation:**
- Passwords hashed with bcrypt (cost: 12)
- No password storage in logs
- Password reset via secure token

**Security Features:**
- Salted and hashed passwords
- Secure password reset flow
- Password complexity requirements
- Account lockout after failed attempts

### 3. Sensitive Data Handling

**Implementation:**
```typescript
// Never log sensitive data
const sanitizeForLogging = (data: any) => {
  const { password, token, apiKey, ...safe } = data;
  return safe;
};

// Mask sensitive fields in responses
const maskEmail = (email: string) => {
  const [local, domain] = email.split('@');
  return `${local.substring(0, 2)}***@${domain}`;
};
```

**Security Features:**
- No sensitive data in logs
- Masked output in error messages
- Secure data deletion
- PII protection

## API Security

### 1. Rate Limiting

**Implementation:**
```typescript
// Implement rate limiting
const rateLimit = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
};

// Apply to sensitive endpoints
app.post('/api/login', rateLimit, loginHandler);
app.post('/api/register', rateLimit, registerHandler);
```

**Security Features:**
- Prevents brute force attacks
- DDoS mitigation
- API abuse prevention
- Per-user rate limits

### 2. CORS Configuration

**Implementation:**
```typescript
// Strict CORS policy
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['https://yourdomain.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
```

**Security Features:**
- Prevents cross-origin attacks
- Whitelist allowed origins
- Credential handling
- Preflight request handling

### 3. CSRF Protection

**Implementation:**
- CSRF tokens for state-changing operations
- SameSite cookie attribute set to 'Strict'
- Double-submit cookie pattern

**Security Features:**
- Prevents CSRF attacks
- Token validation on mutations
- Secure cookie settings

## Database Security

### 1. SQL Injection Prevention

**Implementation:**
```typescript
// Use parameterized queries (Drizzle ORM)
const device = await db
  .select()
  .from(devices)
  .where(eq(devices.deviceId, deviceId)); // Parameterized

// Never use string concatenation
// ❌ WRONG: `SELECT * FROM devices WHERE id = ${id}`
// ✅ RIGHT: Use Drizzle's query builder
```

**Security Features:**
- Parameterized queries
- ORM protection
- Input validation
- Prepared statements

### 2. Access Control

**Implementation:**
- Database user with minimal privileges
- Read-only replicas for analytics
- Separate credentials for different services
- Connection encryption

**Security Features:**
- Principle of least privilege
- Credential rotation
- Audit logging
- Connection monitoring

### 3. Backup Security

**Implementation:**
- Encrypted backups
- Off-site backup storage
- Regular backup testing
- Retention policies

**Security Features:**
- Data recovery capability
- Disaster recovery plan
- Backup integrity verification
- Secure backup access

## Monitoring & Logging

### 1. Security Logging

**Implementation:**
```typescript
// Log security events
const logSecurityEvent = async (event: {
  type: 'login' | 'logout' | 'permission_change' | 'failed_access';
  userId: number;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  details?: any;
}) => {
  await createAuditTrail({
    userId: event.userId,
    action: event.type,
    ipAddress: event.ipAddress,
    userAgent: event.userAgent,
    createdAt: event.timestamp,
  });
};
```

**Security Features:**
- Audit trail for all actions
- Failed access attempts logged
- Permission changes tracked
- User activity monitoring

### 2. Intrusion Detection

**Implementation:**
- Monitor for suspicious patterns
- Alert on multiple failed logins
- Track unusual API usage
- Detect privilege escalation attempts

**Security Features:**
- Real-time alerts
- Anomaly detection
- Incident response procedures
- Security dashboards

### 3. Log Retention

**Implementation:**
- Logs retained for 90 days
- Encrypted log storage
- Immutable audit trails
- Regular log review

**Security Features:**
- Compliance with regulations
- Forensic analysis capability
- Legal hold support
- Secure log deletion

## Deployment Security

### 1. Environment Configuration

**Implementation:**
```typescript
// Use environment variables for secrets
const dbPassword = process.env.DATABASE_PASSWORD;
const apiKey = process.env.API_KEY;
const jwtSecret = process.env.JWT_SECRET;

// Never commit secrets to version control
// Use .env.local and add to .gitignore
```

**Security Features:**
- Secret management
- Environment isolation
- Configuration validation
- Secure defaults

### 2. Dependency Management

**Implementation:**
- Regular dependency updates
- Security vulnerability scanning
- Dependency pinning
- License compliance checking

**Security Features:**
- Patch management
- Vulnerability alerts
- Supply chain security
- Automated updates

### 3. Infrastructure Security

**Implementation:**
- Firewall rules
- Network segmentation
- DDoS protection
- WAF (Web Application Firewall)

**Security Features:**
- Perimeter security
- Network isolation
- Traffic filtering
- Attack mitigation

## Security Checklist

- [ ] Enable HTTPS/TLS
- [ ] Implement OAuth 2.0
- [ ] Set up RBAC
- [ ] Validate all inputs
- [ ] Encrypt sensitive data
- [ ] Implement rate limiting
- [ ] Configure CORS
- [ ] Enable CSRF protection
- [ ] Use parameterized queries
- [ ] Implement audit logging
- [ ] Set up monitoring
- [ ] Regular security audits
- [ ] Penetration testing
- [ ] Incident response plan
- [ ] Security training

## Incident Response

### 1. Security Incident Procedure

1. **Detection**: Monitor for security events
2. **Containment**: Isolate affected systems
3. **Investigation**: Analyze root cause
4. **Remediation**: Fix vulnerabilities
5. **Recovery**: Restore normal operations
6. **Post-Incident**: Review and improve

### 2. Contact Information

- Security Team: security@yourdomain.com
- Incident Response: incident@yourdomain.com
- Bug Bounty: security@yourdomain.com

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [CWE Top 25](https://cwe.mitre.org/top25/)
- [OAuth 2.0 Security](https://tools.ietf.org/html/rfc6749)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
