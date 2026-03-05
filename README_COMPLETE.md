# Device Tracker V2 - Complete Documentation

## 📋 Project Overview

Device Tracker V2 is a comprehensive IoT device management system built with modern web technologies. It provides real-time monitoring, management, and analytics for connected devices with a focus on security, performance, and user experience.

### Key Features

- **Real-time Device Monitoring**: Track device status and connectivity in real-time
- **Advanced Device Management**: Create, update, and manage devices with detailed information
- **Role-Based Access Control (RBAC)**: Three-tier permission system (Admin, Manager, User)
- **Activity Logging**: Comprehensive audit trail for all operations
- **Alert Management**: Configurable alerts with severity levels
- **Interactive Maps**: Visualize device locations on Google Maps
- **Reports & Analytics**: Generate detailed reports with custom filters
- **User Management**: Admin panel for user and permission management
- **Arabic Language Support**: Full RTL support for Arabic interface
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile

## 🏗️ Architecture

### Technology Stack

**Frontend:**
- React 19 with TypeScript
- TailwindCSS for styling
- Recharts for data visualization
- Radix UI components
- tRPC for type-safe API calls
- Vite for fast development

**Backend:**
- Node.js with Express
- tRPC for API endpoints
- Drizzle ORM for database
- MySQL for data storage
- JWT for authentication
- OAuth 2.0 for login

**Infrastructure:**
- Docker for containerization
- Railway for deployment
- GitHub for version control

### Project Structure

```
device-tracker-v2/
├── client/                    # Frontend React application
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/            # Page components
│   │   ├── lib/              # Utility functions
│   │   ├── hooks/            # Custom React hooks
│   │   ├── contexts/         # React contexts
│   │   └── App.tsx           # Main app component
│   └── index.html            # HTML entry point
├── server/                    # Backend application
│   ├── _core/                # Core server utilities
│   ├── routers.ts            # API route definitions
│   ├── db.ts                 # Database functions
│   ├── permissions.ts        # RBAC logic
│   └── storage.ts            # File storage
├── drizzle/                   # Database schema and migrations
│   ├── schema.ts             # Table definitions
│   └── migrations/           # Migration files
├── shared/                    # Shared types and utilities
├── package.json              # Dependencies
├── Dockerfile                # Docker configuration
└── railway.json              # Railway deployment config
```

## 🚀 Getting Started

### Prerequisites

- Node.js 22+
- pnpm 10+
- MySQL 8+
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/kingebrahimopq-create/device-tracker-v2.git
   cd device-tracker-v2
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Set up database**
   ```bash
   pnpm run db:push
   ```

5. **Start development server**
   ```bash
   pnpm run dev
   ```

6. **Access the application**
   - Frontend: http://localhost:5173
   - Backend: http://localhost:3000

## 📚 Features Documentation

### 1. Device Management

**Create Device:**
- Navigate to Devices → Add New Device
- Fill in device information (ID, name, type, location)
- Set GPS coordinates for map display
- Assign device type and owner

**View Devices:**
- Dashboard shows all accessible devices
- Filter by status, type, or location
- Search functionality for quick access
- Pagination for large datasets

**Edit Device:**
- Update device information
- Change device status
- Modify location and coordinates
- Update firmware version

**Delete Device:**
- Requires admin permission
- Confirmation dialog prevents accidental deletion
- Audit trail records deletion

### 2. Activity Logging

**Features:**
- Automatic logging of all operations
- Timestamp and user information
- Action type classification
- Old and new value comparison
- CSV export functionality

**Access:**
- View in Device Detail page
- Comprehensive Activity Logs page
- Filter by date, user, or action type

### 3. Alert Management

**Alert Types:**
- Device disconnection
- Connection established
- Status changes
- Unauthorized access attempts
- Maintenance due
- Firmware updates
- Temperature/Battery alerts

**Alert Severity:**
- Low: Informational
- Medium: Requires attention
- High: Urgent action needed
- Critical: System failure

**Management:**
- View all alerts on Alerts page
- Mark alerts as resolved
- Filter by status and severity
- Automatic alert creation on events

### 4. User Management

**Admin Features:**
- View all users
- Assign roles (Admin, Manager, User)
- Manage user permissions
- Track user activity
- Deactivate users

**User Roles:**
- **Admin**: Full system access, user management
- **Manager**: Device management, user oversight
- **User**: Limited access to assigned devices

### 5. Reports

**Available Reports:**
- Device statistics (total, connected, disconnected)
- Activity logs with filters
- Alert summaries by severity
- User activity reports

**Export Options:**
- CSV format for spreadsheets
- PDF format for printing
- Custom date range selection

### 6. Interactive Maps

**Features:**
- Display devices on Google Maps
- Color-coded status indicators
- Device search and filtering
- Location history timeline
- Real-time location updates

**Markers:**
- Green: Connected devices
- Red: Disconnected devices
- Yellow: Maintenance mode
- Gray: Inactive devices

## 🔐 Security Features

### Authentication

- OAuth 2.0 with PKCE flow
- JWT token management
- Secure session cookies
- Automatic token refresh
- Session timeout (30 minutes)

### Authorization

- Role-Based Access Control (RBAC)
- Device-level permissions
- Permission expiration support
- Audit trail for permission changes

### Data Protection

- TLS/SSL encryption in transit
- Password hashing with bcrypt
- Input validation with Zod
- SQL injection prevention
- CSRF protection

### Monitoring

- Comprehensive audit logging
- Security event tracking
- Failed access attempt logging
- Suspicious activity detection

## 🎨 UI/UX Features

### Responsive Design

- Mobile-first approach
- Tablet optimization
- Desktop full features
- Adaptive layouts
- Touch-friendly controls

### Arabic Language Support

- Full RTL (Right-to-Left) layout
- Arabic number formatting
- Translated UI elements
- Proper text alignment
- Cultural considerations

### Accessibility

- WCAG 2.1 compliance
- Keyboard navigation
- Screen reader support
- Color contrast compliance
- ARIA labels and descriptions

## ⚙️ Configuration

### Environment Variables

```env
# Database
DATABASE_URL=mysql://user:password@host:port/database

# Authentication
OAUTH_CLIENT_ID=your_client_id
OAUTH_CLIENT_SECRET=your_client_secret
OAUTH_REDIRECT_URI=https://yourdomain.com/api/oauth/callback

# JWT
JWT_SECRET=your_jwt_secret

# API Keys
VITE_FRONTEND_FORGE_API_KEY=your_api_key

# Server
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
```

### Database Configuration

The application uses Drizzle ORM with MySQL. Database schema includes:

- **users**: User accounts and roles
- **devices**: IoT device information
- **device_types**: Device type classifications
- **device_permissions**: Access control
- **activity_logs**: Audit trail
- **alerts**: System alerts
- **notifications**: User notifications
- **location_history**: Device location tracking

## 📊 Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  openId VARCHAR(64) UNIQUE NOT NULL,
  name TEXT,
  email VARCHAR(320) UNIQUE,
  role ENUM('admin', 'manager', 'user') DEFAULT 'user',
  isActive BOOLEAN DEFAULT true,
  department VARCHAR(255),
  phone VARCHAR(20),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  lastSignedIn TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Devices Table
```sql
CREATE TABLE devices (
  id INT PRIMARY KEY AUTO_INCREMENT,
  deviceId VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  deviceTypeId INT NOT NULL,
  status ENUM('connected', 'disconnected', 'maintenance', 'inactive') DEFAULT 'disconnected',
  location VARCHAR(255),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  ipAddress VARCHAR(45),
  macAddress VARCHAR(17),
  firmwareVersion VARCHAR(50),
  serialNumber VARCHAR(100) UNIQUE,
  lastSeen TIMESTAMP,
  lastStatusChange TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  metadata JSON,
  ownerId INT NOT NULL,
  createdBy INT NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (deviceTypeId) REFERENCES device_types(id),
  FOREIGN KEY (ownerId) REFERENCES users(id),
  FOREIGN KEY (createdBy) REFERENCES users(id)
);
```

## 🧪 Testing

### Run Tests

```bash
# Run all tests
pnpm run test

# Run tests in watch mode
pnpm run test:watch

# Generate coverage report
pnpm run test:coverage
```

### Test Files

- `server/device.test.ts`: Device management tests
- `server/rbac.test.ts`: RBAC and permission tests
- `server/auth.logout.test.ts`: Authentication tests

## 📈 Performance Optimization

### Frontend Optimizations

- Code splitting and lazy loading
- Component memoization
- Virtual scrolling for large lists
- Image optimization
- CSS minification

### Backend Optimizations

- Database query optimization with indexes
- Redis caching for frequently accessed data
- API response compression
- Connection pooling
- Query pagination

**Performance Targets:**
- First Contentful Paint (FCP): < 1.8s
- Largest Contentful Paint (LCP): < 2.5s
- API response time: < 200ms
- Database query time: < 100ms

See [PERFORMANCE_OPTIMIZATION.md](./PERFORMANCE_OPTIMIZATION.md) for detailed information.

## 🔒 Security Hardening

### Implemented Measures

- OAuth 2.0 authentication
- RBAC with audit logging
- Input validation and sanitization
- SQL injection prevention
- CSRF protection
- Rate limiting
- CORS configuration
- Encrypted data transmission
- Secure password hashing

See [SECURITY_HARDENING.md](./SECURITY_HARDENING.md) for detailed information.

## 🚢 Deployment

### Railway Deployment

1. **Connect GitHub repository** to Railway
2. **Configure environment variables** in Railway dashboard
3. **Set up MySQL database** (Railway plugin or external)
4. **Deploy** - Railway automatically builds and deploys
5. **Run migrations** - Execute database migrations
6. **Configure custom domain** - Add your domain

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

### Docker Deployment

```bash
# Build Docker image
docker build -t device-tracker-v2:latest .

# Run container
docker run -p 3000:3000 \
  -e DATABASE_URL="mysql://..." \
  device-tracker-v2:latest
```

## 📝 API Documentation

### Authentication Endpoints

- `POST /api/oauth/callback` - OAuth callback
- `POST /api/logout` - Logout user

### Device Endpoints

- `GET /api/trpc/device.list` - List devices
- `GET /api/trpc/device.get` - Get device by ID
- `POST /api/trpc/device.create` - Create device
- `POST /api/trpc/device.update` - Update device
- `POST /api/trpc/device.delete` - Delete device
- `POST /api/trpc/device.updateStatus` - Update device status

### User Endpoints

- `GET /api/trpc/user.list` - List users
- `POST /api/trpc/user.updateRole` - Update user role

### Activity Endpoints

- `GET /api/trpc/log.list` - List activity logs
- `GET /api/trpc/log.listByDevice` - Get logs for device

### Alert Endpoints

- `GET /api/trpc/alert.list` - List alerts
- `POST /api/trpc/alert.resolve` - Resolve alert

## 🤝 Contributing

### Development Workflow

1. Create a feature branch
2. Make your changes
3. Write tests for new features
4. Run tests and linting
5. Submit pull request

### Code Style

- Use TypeScript for type safety
- Follow ESLint configuration
- Format code with Prettier
- Write meaningful commit messages

## 📞 Support

### Getting Help

- Check documentation in this README
- Review DEPLOYMENT.md for deployment issues
- Review SECURITY_HARDENING.md for security questions
- Check PERFORMANCE_OPTIMIZATION.md for performance issues

### Reporting Issues

1. Check existing issues on GitHub
2. Provide detailed description
3. Include error messages and logs
4. Provide steps to reproduce

## 📄 License

This project is licensed under the MIT License - see LICENSE file for details.

## 🙏 Acknowledgments

- React team for excellent framework
- Radix UI for accessible components
- Drizzle ORM for database management
- Railway for hosting platform
- All contributors and users

## 📅 Version History

### Version 1.0.0 (Current)

- ✅ Complete device management system
- ✅ Role-based access control
- ✅ Activity logging and audit trail
- ✅ Alert management system
- ✅ Interactive maps
- ✅ Comprehensive reports
- ✅ User management
- ✅ Arabic language support with RTL
- ✅ Performance optimization
- ✅ Security hardening
- ✅ Docker containerization
- ✅ Railway deployment ready

## 🔄 Future Enhancements

- WebSocket for real-time updates
- Advanced filtering options
- Custom dashboard widgets
- Mobile app (React Native)
- Webhook integrations
- API rate limiting per user
- Advanced analytics
- Machine learning for anomaly detection
- Multi-language support
- Dark mode theme

## 📚 Resources

- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)
- [Drizzle ORM Documentation](https://orm.drizzle.team)
- [tRPC Documentation](https://trpc.io)
- [Railway Documentation](https://docs.railway.app)

---

**Last Updated**: March 5, 2024
**Project Status**: Production Ready
**Maintainer**: Device Tracker Team
