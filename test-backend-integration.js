#!/usr/bin/env node

/**
 * AdaPlanning Backend Integration Test Suite
 * 
 * PESSIMISTIC TESTING - Assume everything will break!
 * Tests ALL API endpoints, error handling, CORS, and edge cases
 */

const API_BASE = process.env.NEXT_PUBLIC_ADA_API_URL || 'https://ada.mindgen.app/api/v1';

const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

class BackendTester {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      errors: []
    };
    this.token = null;
  }

  log(message, color = 'white') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(this.token && { 'Authorization': `Bearer ${this.token}` }),
      ...options.headers,
    };

    try {
      const response = await fetch(url, { ...options, headers });
      
      const responseData = {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries()),
      };

      try {
        responseData.data = await response.json();
      } catch (e) {
        responseData.data = await response.text();
      }

      return responseData;
    } catch (error) {
      return {
        error: error.message,
        type: error.name,
      };
    }
  }

  async test(description, testFn) {
    process.stdout.write(`${colors.cyan}Testing: ${description}${colors.reset} ... `);
    
    try {
      const result = await testFn();
      if (result === true || result === undefined) {
        this.log('✅ PASS', 'green');
        this.results.passed++;
      } else if (typeof result === 'string' && result.startsWith('WARN:')) {
        this.log(`⚠️  ${result}`, 'yellow');
        this.results.warnings++;
      } else {
        this.log(`❌ FAIL: ${result}`, 'red');
        this.results.failed++;
        this.results.errors.push({ test: description, error: result });
      }
    } catch (error) {
      this.log(`❌ ERROR: ${error.message}`, 'red');
      this.results.failed++;
      this.results.errors.push({ test: description, error: error.message });
    }
  }

  async testCORS() {
    this.log('\n🌐 TESTING CORS CONFIGURATION', 'bold');
    
    await this.test('CORS preflight request', async () => {
      const response = await fetch(`${API_BASE}/staff`, {
        method: 'OPTIONS',
      });
      
      const corsHeaders = response.headers.get('Access-Control-Allow-Origin');
      if (!corsHeaders) {
        return 'CORS headers not found';
      }
      return true;
    });

    await this.test('CORS allows localhost', async () => {
      const response = await this.request('/staff', {
        headers: { 'Origin': 'http://localhost:3000' }
      });
      
      if (response.error && response.error.includes('CORS')) {
        return 'CORS blocking localhost';
      }
      return true;
    });

    await this.test('CORS allows Vercel domain', async () => {
      const response = await this.request('/staff', {
        headers: { 'Origin': 'https://ada-planning.vercel.app' }
      });
      
      if (response.error && response.error.includes('CORS')) {
        return 'CORS blocking Vercel domain';
      }
      return true;
    });
  }

  async testAuthentication() {
    this.log('\n🔐 TESTING AUTHENTICATION', 'bold');
    
    // Test login with demo credentials
    await this.test('Login with demo credentials', async () => {
      const response = await this.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'jessica@losteria.be',
          password: 'demo123'
        })
      });

      if (response.error) {
        return `Network error: ${response.error}`;
      }

      if (!response.ok) {
        return `HTTP ${response.status}: ${response.statusText} - ${JSON.stringify(response.data)}`;
      }

      if (!response.data.token) {
        return 'No token in response';
      }

      this.token = response.data.token;
      return true;
    });

    // Test invalid credentials
    await this.test('Invalid credentials are rejected', async () => {
      const response = await this.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'invalid@email.com',
          password: 'wrongpassword'
        })
      });

      if (response.ok) {
        return 'Invalid credentials were accepted!';
      }

      if (response.status === 401 || response.status === 400) {
        return true;
      }

      return `Unexpected status: ${response.status}`;
    });

    // Test protected route without token
    await this.test('Protected routes require authentication', async () => {
      const oldToken = this.token;
      this.token = null;
      
      const response = await this.request('/staff');
      
      this.token = oldToken;
      
      if (response.ok) {
        return 'WARN: Protected route accessible without token';
      }
      
      return response.status === 401 ? true : `Unexpected status: ${response.status}`;
    });
  }

  async testStaffAPI() {
    this.log('\n👥 TESTING STAFF API', 'bold');
    
    await this.test('Get all staff', async () => {
      const response = await this.request('/staff');
      
      if (response.error) return `Network error: ${response.error}`;
      if (!response.ok) return `HTTP ${response.status}: ${response.statusText}`;
      
      if (!Array.isArray(response.data.data)) {
        return 'Response is not an array';
      }
      
      if (response.data.data.length === 0) {
        return 'WARN: No staff members found';
      }
      
      return true;
    });

    await this.test('Get active staff only', async () => {
      const response = await this.request('/staff?active_only=true');
      
      if (response.error) return `Network error: ${response.error}`;
      if (!response.ok) return `HTTP ${response.status}: ${response.statusText}`;
      
      const inactiveStaff = response.data.data.filter(staff => !staff.is_active);
      if (inactiveStaff.length > 0) {
        return 'Inactive staff returned with active_only=true';
      }
      
      return true;
    });

    await this.test('Create new staff member', async () => {
      const newStaff = {
        first_name: 'Test',
        last_name: 'User',
        email: `test.${Date.now()}@example.com`,
        position: 'server',
        hourly_rate: 12.50,
        is_active: true
      };

      const response = await this.request('/staff', {
        method: 'POST',
        body: JSON.stringify(newStaff)
      });

      if (response.error) return `Network error: ${response.error}`;
      if (!response.ok) return `HTTP ${response.status}: ${response.statusText}`;
      
      const created = response.data;
      if (!created.id) {
        return 'Created staff has no ID';
      }
      
      // Store for later tests
      this.testStaffId = created.id;
      return true;
    });

    await this.test('Update staff member', async () => {
      if (!this.testStaffId) return 'No test staff ID available';
      
      const response = await this.request(`/staff/${this.testStaffId}`, {
        method: 'PUT',
        body: JSON.stringify({
          hourly_rate: 13.00
        })
      });

      if (response.error) return `Network error: ${response.error}`;
      if (!response.ok) return `HTTP ${response.status}: ${response.statusText}`;
      
      return true;
    });
  }

  async testShiftsAPI() {
    this.log('\n⏰ TESTING SHIFTS API', 'bold');
    
    await this.test('Get all shifts', async () => {
      const response = await this.request('/shifts');
      
      if (response.error) return `Network error: ${response.error}`;
      if (!response.ok) return `HTTP ${response.status}: ${response.statusText}`;
      
      if (!Array.isArray(response.data.data)) {
        return 'Response is not an array';
      }
      
      return true;
    });

    await this.test('Get shifts by date', async () => {
      const today = new Date().toISOString().split('T')[0];
      const response = await this.request(`/shifts?date=${today}`);
      
      if (response.error) return `Network error: ${response.error}`;
      if (!response.ok) return `HTTP ${response.status}: ${response.statusText}`;
      
      return true;
    });

    await this.test('Create new shift', async () => {
      if (!this.testStaffId) return 'WARN: Skipping - no test staff ID';
      
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const newShift = {
        staff_member_id: this.testStaffId,
        scheduled_date: tomorrow.toISOString().split('T')[0],
        start_time: '09:00',
        end_time: '17:00',
        position: 'server',
        calculated_hours: 8.0
      };

      const response = await this.request('/shifts', {
        method: 'POST',
        body: JSON.stringify(newShift)
      });

      if (response.error) return `Network error: ${response.error}`;
      if (!response.ok) return `HTTP ${response.status}: ${response.statusText}`;
      
      const created = response.data;
      if (!created.id) {
        return 'Created shift has no ID';
      }
      
      this.testShiftId = created.id;
      return true;
    });

    await this.test('Update shift times', async () => {
      if (!this.testShiftId) return 'WARN: Skipping - no test shift ID';
      
      const response = await this.request(`/shifts/${this.testShiftId}`, {
        method: 'PUT',
        body: JSON.stringify({
          start_time: '10:00',
          end_time: '18:00',
          calculated_hours: 8.0
        })
      });

      if (response.error) return `Network error: ${response.error}`;
      if (!response.ok) return `HTTP ${response.status}: ${response.statusText}`;
      
      return true;
    });

    await this.test('Move shift to different date', async () => {
      if (!this.testShiftId) return 'WARN: Skipping - no test shift ID';
      
      const dayAfterTomorrow = new Date();
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
      
      const response = await this.request(`/shifts/${this.testShiftId}`, {
        method: 'PUT',
        body: JSON.stringify({
          scheduled_date: dayAfterTomorrow.toISOString().split('T')[0]
        })
      });

      if (response.error) return `Network error: ${response.error}`;
      if (!response.ok) return `HTTP ${response.status}: ${response.statusText}`;
      
      return true;
    });

    await this.test('Bulk create shifts', async () => {
      if (!this.testStaffId) return 'WARN: Skipping - no test staff ID';
      
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      
      const bulkShifts = [
        {
          staff_member_id: this.testStaffId,
          scheduled_date: nextWeek.toISOString().split('T')[0],
          start_time: '09:00',
          end_time: '13:00',
          position: 'server',
          calculated_hours: 4.0
        },
        {
          staff_member_id: this.testStaffId,
          scheduled_date: nextWeek.toISOString().split('T')[0],
          start_time: '14:00',
          end_time: '18:00',
          position: 'server',
          calculated_hours: 4.0
        }
      ];

      const response = await this.request('/shifts/bulk', {
        method: 'POST',
        body: JSON.stringify({ shifts: bulkShifts })
      });

      if (response.error) return `Network error: ${response.error}`;
      if (!response.ok) return `HTTP ${response.status}: ${response.statusText}`;
      
      return true;
    });
  }

  async testErrorHandling() {
    this.log('\n🚨 TESTING ERROR HANDLING', 'bold');
    
    await this.test('Invalid JSON handling', async () => {
      const response = await this.request('/staff', {
        method: 'POST',
        body: 'invalid json{'
      });

      if (response.ok) {
        return 'Invalid JSON was accepted';
      }
      
      return response.status === 400 ? true : `Unexpected status: ${response.status}`;
    });

    await this.test('Non-existent endpoint', async () => {
      const response = await this.request('/nonexistent');
      
      return response.status === 404 ? true : `Expected 404, got ${response.status}`;
    });

    await this.test('Invalid staff ID', async () => {
      const response = await this.request('/staff/invalid-id');
      
      return response.status === 404 || response.status === 400 ? 
        true : `Expected 404/400, got ${response.status}`;
    });

    await this.test('Invalid shift data', async () => {
      const response = await this.request('/shifts', {
        method: 'POST',
        body: JSON.stringify({
          start_time: '25:00', // Invalid time
          end_time: '10:00'    // End before start
        })
      });

      if (response.ok) {
        return 'Invalid shift data was accepted';
      }
      
      return response.status === 400 ? true : `Expected 400, got ${response.status}`;
    });
  }

  async testPerformance() {
    this.log('\n⚡ TESTING PERFORMANCE', 'bold');
    
    await this.test('Response time under 2 seconds', async () => {
      const start = Date.now();
      const response = await this.request('/staff');
      const duration = Date.now() - start;
      
      if (response.error) return `Network error: ${response.error}`;
      
      if (duration > 2000) {
        return `Response took ${duration}ms (>2000ms)`;
      } else if (duration > 1000) {
        return `WARN: Response took ${duration}ms (>1000ms)`;
      }
      
      return true;
    });

    await this.test('Concurrent requests handling', async () => {
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(this.request('/staff'));
      }
      
      const responses = await Promise.all(promises);
      const failed = responses.filter(r => !r.ok || r.error).length;
      
      if (failed > 2) {
        return `${failed}/10 concurrent requests failed`;
      } else if (failed > 0) {
        return `WARN: ${failed}/10 concurrent requests failed`;
      }
      
      return true;
    });
  }

  async cleanup() {
    this.log('\n🧹 CLEANING UP TEST DATA', 'bold');
    
    if (this.testShiftId) {
      await this.test('Delete test shift', async () => {
        const response = await this.request(`/shifts/${this.testShiftId}`, {
          method: 'DELETE'
        });
        
        if (response.error) return `Network error: ${response.error}`;
        return response.ok || response.status === 404 ? true : `HTTP ${response.status}`;
      });
    }

    if (this.testStaffId) {
      await this.test('Deactivate test staff', async () => {
        const response = await this.request(`/staff/${this.testStaffId}`, {
          method: 'PUT',
          body: JSON.stringify({ is_active: false })
        });
        
        if (response.error) return `Network error: ${response.error}`;
        return response.ok ? true : `HTTP ${response.status}`;
      });
    }
  }

  async runAllTests() {
    this.log(`\n${colors.bold}${colors.magenta}🔥 ADAPLANNING BACKEND INTEGRATION TESTS 🔥${colors.reset}`);
    this.log(`${colors.blue}Testing API: ${API_BASE}${colors.reset}`);
    this.log(`${colors.blue}Date: ${new Date().toISOString()}${colors.reset}\n`);

    await this.testCORS();
    await this.testAuthentication();
    await this.testStaffAPI();
    await this.testShiftsAPI();
    await this.testErrorHandling();
    await this.testPerformance();
    await this.cleanup();

    this.printSummary();
  }

  printSummary() {
    this.log('\n' + '='.repeat(60), 'bold');
    this.log('📊 TEST SUMMARY', 'bold');
    this.log('='.repeat(60), 'bold');
    
    this.log(`✅ Passed: ${this.results.passed}`, 'green');
    this.log(`⚠️  Warnings: ${this.results.warnings}`, 'yellow');
    this.log(`❌ Failed: ${this.results.failed}`, this.results.failed > 0 ? 'red' : 'green');
    
    const total = this.results.passed + this.results.warnings + this.results.failed;
    const successRate = ((this.results.passed / total) * 100).toFixed(1);
    
    this.log(`\n📈 Success Rate: ${successRate}%`, 
      successRate >= 90 ? 'green' : successRate >= 70 ? 'yellow' : 'red');

    if (this.results.failed > 0) {
      this.log('\n❌ FAILED TESTS:', 'red');
      this.results.errors.forEach(error => {
        this.log(`   • ${error.test}: ${error.error}`, 'red');
      });
    }

    if (this.results.failed === 0 && this.results.warnings <= 2) {
      this.log('\n🎉 BACKEND IS READY FOR PRODUCTION! 🚀', 'green');
    } else if (this.results.failed <= 3) {
      this.log('\n⚠️  BACKEND NEEDS MINOR FIXES BEFORE PRODUCTION', 'yellow');
    } else {
      this.log('\n🚨 BACKEND HAS CRITICAL ISSUES - NOT READY FOR PRODUCTION', 'red');
    }

    this.log('\n' + '='.repeat(60), 'bold');
  }
}

// Run the tests
const tester = new BackendTester();
tester.runAllTests().catch(console.error);