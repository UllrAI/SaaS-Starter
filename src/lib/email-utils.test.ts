// Email utility functions for testing

// Create a simple utility function to test email formatting
export function formatEmailSubject(appName: string, subject: string): string {
  return `[${appName}] ${subject}`;
}

export function formatEmailSender(appName: string, email: string): string {
  return `${appName} <${email}>`;
}

export function validateEmailAddress(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function sanitizeEmailContent(content: string): string {
  // Remove potentially dangerous HTML tags
  return content
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
    .replace(/javascript:/gi, '');
}

describe('Email Utilities', () => {
  describe('formatEmailSubject', () => {
    it('should format email subject with app name prefix', () => {
      const result = formatEmailSubject('MyApp', 'Welcome to our service');
      expect(result).toBe('[MyApp] Welcome to our service');
    });

    it('should handle empty subject', () => {
      const result = formatEmailSubject('MyApp', '');
      expect(result).toBe('[MyApp] ');
    });

    it('should handle special characters in app name', () => {
      const result = formatEmailSubject('My-App & Co.', 'Test Subject');
      expect(result).toBe('[My-App & Co.] Test Subject');
    });

    it('should handle long subjects', () => {
      const longSubject = 'This is a very long email subject that might be truncated in some email clients';
      const result = formatEmailSubject('App', longSubject);
      expect(result).toBe(`[App] ${longSubject}`);
    });
  });

  describe('formatEmailSender', () => {
    it('should format sender with app name and email', () => {
      const result = formatEmailSender('MyApp', 'noreply@example.com');
      expect(result).toBe('MyApp <noreply@example.com>');
    });

    it('should handle special characters in app name', () => {
      const result = formatEmailSender('My App & Co.', 'test@example.com');
      expect(result).toBe('My App & Co. <test@example.com>');
    });

    it('should handle empty app name', () => {
      const result = formatEmailSender('', 'test@example.com');
      expect(result).toBe(' <test@example.com>');
    });

    it('should handle unicode characters in app name', () => {
      const result = formatEmailSender('MyApp™', 'test@example.com');
      expect(result).toBe('MyApp™ <test@example.com>');
    });
  });

  describe('validateEmailAddress', () => {
    it('should validate correct email addresses', () => {
      expect(validateEmailAddress('user@example.com')).toBe(true);
      expect(validateEmailAddress('test.email+tag@domain.co.uk')).toBe(true);
      expect(validateEmailAddress('user123@test-domain.com')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(validateEmailAddress('invalid-email')).toBe(false);
      expect(validateEmailAddress('@example.com')).toBe(false);
      expect(validateEmailAddress('user@')).toBe(false);
      expect(validateEmailAddress('user@@example.com')).toBe(false);
      expect(validateEmailAddress('')).toBe(false);
    });

    it('should handle edge cases', () => {
      expect(validateEmailAddress('user @example.com')).toBe(false); // space
      expect(validateEmailAddress('user@example')).toBe(false); // no TLD
      expect(validateEmailAddress('user@.com')).toBe(false); // missing domain
    });
  });

  describe('sanitizeEmailContent', () => {
    it('should remove script tags', () => {
      const maliciousContent = 'Hello <script>alert("xss")</script> World';
      const result = sanitizeEmailContent(maliciousContent);
      expect(result).toBe('Hello  World');
    });

    it('should remove iframe tags', () => {
      const maliciousContent = 'Content <iframe src="evil.com"></iframe> more content';
      const result = sanitizeEmailContent(maliciousContent);
      expect(result).toBe('Content  more content');
    });

    it('should remove javascript protocols', () => {
      const maliciousContent = 'Click <a href="javascript:alert()">here</a>';
      const result = sanitizeEmailContent(maliciousContent);
      expect(result).toBe('Click <a href="alert()">here</a>');
    });

    it('should handle multiple threats', () => {
      const maliciousContent = `
        <script>evil()</script>
        <iframe src="bad.com"></iframe>
        <a href="javascript:alert()">link</a>
      `;
      const result = sanitizeEmailContent(maliciousContent);
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('<iframe>');
      expect(result).not.toContain('javascript:');
    });

    it('should preserve safe HTML', () => {
      const safeContent = '<p>Hello <strong>world</strong></p>';
      const result = sanitizeEmailContent(safeContent);
      expect(result).toBe(safeContent);
    });

    it('should handle empty content', () => {
      const result = sanitizeEmailContent('');
      expect(result).toBe('');
    });

    it('should be case insensitive for security threats', () => {
      const maliciousContent = '<SCRIPT>alert()</SCRIPT> <IFRAME></IFRAME>';
      const result = sanitizeEmailContent(maliciousContent);
      expect(result.trim()).toBe('');
    });
  });

  describe('Email Processing Pipeline', () => {
    it('should process a complete email configuration', () => {
      const appName = 'TestApp';
      const email = 'noreply@testapp.com';
      const subject = 'Welcome!';
      const recipientEmail = 'user@example.com';
      const content = '<p>Welcome to our service!</p>';

      // Validate recipient
      expect(validateEmailAddress(recipientEmail)).toBe(true);

      // Format components
      const formattedSender = formatEmailSender(appName, email);
      const formattedSubject = formatEmailSubject(appName, subject);
      const sanitizedContent = sanitizeEmailContent(content);

      expect(formattedSender).toBe('TestApp <noreply@testapp.com>');
      expect(formattedSubject).toBe('[TestApp] Welcome!');
      expect(sanitizedContent).toBe('<p>Welcome to our service!</p>');
    });

    it('should handle edge cases in email processing', () => {
      const appName = 'My App & Co.™';
      const email = 'support@my-app.co.uk';
      const subject = 'Password Reset Request';
      const recipientEmail = 'test.user+tag@domain.com';
      const content = '<p>Reset your password</p><script>evil()</script>';

      expect(validateEmailAddress(recipientEmail)).toBe(true);
      expect(formatEmailSender(appName, email)).toBe('My App & Co.™ <support@my-app.co.uk>');
      expect(formatEmailSubject(appName, subject)).toBe('[My App & Co.™] Password Reset Request');
      expect(sanitizeEmailContent(content)).toBe('<p>Reset your password</p>');
    });
  });
});