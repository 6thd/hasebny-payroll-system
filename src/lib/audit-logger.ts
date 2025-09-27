import { Timestamp } from 'firebase/firestore';

export interface AuditLogEntry {
  id: string;
  timestamp: Timestamp;
  userId: string;
  userName: string;
  action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE';
  resourceType: 'EMPLOYEE' | 'SALARY' | 'LEAVE_REQUEST' | 'ATTENDANCE' | 'OTHER';
  resourceId: string;
  resourceName?: string;
  changes?: Record<string, { before: any; after: any }>;
  ipAddress?: string;
  userAgent?: string;
  details?: string;
}

/**
 * Audit logging utility for tracking all modifications to payroll data
 */
export class AuditLogger {
  /**
   * Log an action to the audit trail
   * @param entry Audit log entry
   */
  static async log(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<void> {
    try {
      // In a real implementation, this would write to Firestore
      // For now, we'll just log to console
      console.log('Audit Log Entry:', {
        ...entry,
        id: this.generateId(),
        timestamp: Timestamp.now()
      });
      
      // TODO: Implement actual Firestore write
      // await firestore.collection('auditLogs').add({
      //   ...entry,
      //   id: this.generateId(),
      //   timestamp: Timestamp.now()
      // });
    } catch (error) {
      console.error('Failed to log audit entry:', error);
      // In production, you might want to queue failed logs for retry
    }
  }
  
  /**
   * Log employee data modification
   * @param userId User ID making the change
   * @param userName User name making the change
   * @param action Type of action
   * @param employeeId Employee ID being modified
   * @param employeeName Employee name
   * @param changes Description of changes
   */
  static async logEmployeeModification(
    userId: string,
    userName: string,
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    employeeId: string,
    employeeName: string,
    changes?: Record<string, { before: any; after: any }>,
    details?: string
  ): Promise<void> {
    await this.log({
      userId,
      userName,
      action,
      resourceType: 'EMPLOYEE',
      resourceId: employeeId,
      resourceName: employeeName,
      changes,
      details
    });
  }
  
  /**
   * Log payroll calculation or modification
   * @param userId User ID making the change
   * @param userName User name making the change
   * @param employeeId Employee ID
   * @param employeeName Employee name
   * @param details Description of payroll action
   */
  static async logPayrollAction(
    userId: string,
    userName: string,
    employeeId: string,
    employeeName: string,
    details: string
  ): Promise<void> {
    await this.log({
      userId,
      userName,
      action: 'UPDATE', // Payroll calculations are updates
      resourceType: 'SALARY',
      resourceId: employeeId,
      resourceName: employeeName,
      details
    });
  }
  
  /**
   * Log leave request action
   * @param userId User ID making the change
   * @param userName User name making the change
   * @param action Type of action
   * @param requestId Leave request ID
   * @param employeeId Employee ID
   * @param employeeName Employee name
   * @param details Description of action
   */
  static async logLeaveRequestAction(
    userId: string,
    userName: string,
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    requestId: string,
    employeeId: string,
    employeeName: string,
    details?: string
  ): Promise<void> {
    await this.log({
      userId,
      userName,
      action,
      resourceType: 'LEAVE_REQUEST',
      resourceId: requestId,
      resourceName: `${employeeName}'s leave request`,
      details
    });
  }
  
  /**
   * Log attendance action
   * @param userId User ID making the change
   * @param userName User name making the change
   * @param action Type of action
   * @param employeeId Employee ID
   * @param employeeName Employee name
   * @param date Date of attendance
   * @param details Description of action
   */
  static async logAttendanceAction(
    userId: string,
    userName: string,
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    employeeId: string,
    employeeName: string,
    date: string,
    details?: string
  ): Promise<void> {
    await this.log({
      userId,
      userName,
      action,
      resourceType: 'ATTENDANCE',
      resourceId: `${employeeId}_${date}`,
      resourceName: `${employeeName}'s attendance on ${date}`,
      details
    });
  }
  
  /**
   * Generate a unique ID for audit log entries
   * @returns Unique ID string
   */
  private static generateId(): string {
    return 'audit_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
}

// Example usage:
// AuditLogger.logEmployeeModification(
//   'user123',
//   'John Admin',
//   'UPDATE',
//   'emp456',
//   'Jane Doe',
//   {
//     basicSalary: { before: 3000, after: 3500 }
//   },
//   'Annual salary review adjustment'
// );