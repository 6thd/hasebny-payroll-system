
'use server';

import { adminDb } from '../../lib/firebase/admin';
import type { Worker, MonthlyData, PayrollData } from "../../types";
import { Timestamp, type QueryDocumentSnapshot } from 'firebase-admin/firestore';

const EMPLOYEE_COLLECTION = 'employees';

// Helper to safely convert a string or Date to a JS Date object
const toJsDate = (date: any): Date | null => {
    if (!date) return null;
    if (date instanceof Date) return date;
    if (typeof date === 'string') {
        const d = new Date(date);
        if (!isNaN(d.getTime())) {
            return d;
        }
    }
    // Handle Firestore Timestamps on the server
    if (date.toDate && typeof date.toDate === 'function') {
        return date.toDate();
    }
    return null;
};


// New, consolidated function to get all data needed for the payroll modal
export async function getPayrollDetails(payload: { employeeId: string; year: number; month: number; }) {
    if (!payload.employeeId) {
        return { error: 'Invalid employee ID provided.' };
    }
    const { employeeId, year, month } = payload;

    try {
        const [workerDoc, monthlyDataDoc] = await Promise.all([
            adminDb.collection(EMPLOYEE_COLLECTION).doc(employeeId).get(),
            adminDb.collection(`salaries_${year}_${month + 1}`).doc(employeeId).get()
        ]);

        if (!workerDoc.exists) {
            const errorMessage = `خطأ من الخادم: الموظف بالمعرّف "${employeeId}" غير موجود في مجموعة '${EMPLOYEE_COLLECTION}'. هذا يعني غالبًا أن الخادم والمتصفح لا يتصلان بنفس قاعدة البيانات. يرجى التحقق من متغيرات البيئة الخاصة بالخادم.`;
            console.error(errorMessage);
            return { error: errorMessage };
        }

        const workerData = workerDoc.data();
        if (workerData?.hiringDate) {
            workerData.hiringDate = workerData.hiringDate.toDate().toISOString().split('T')[0];
        }

        const worker = { id: workerDoc.id, ...workerData } as Worker;
        
        const monthlyData = monthlyDataDoc.exists ? monthlyDataDoc.data() as MonthlyData : { advances: 0, penalties: 0, commission: 0 };

        return { worker, monthlyData };

    } catch (error: any) {
        console.error("Error fetching payroll details:", error);
        return { error: error.message };
    }
}


// Placeholder for a function to get all employees
export async function getAllEmployees() {
    try {
        const snapshot = await adminDb.collection(EMPLOYEE_COLLECTION).get();
        const workers = snapshot.docs.map((doc: QueryDocumentSnapshot) => ({ id: doc.id, ...doc.data() } as Worker));
        return { workers };
    } catch (error: any) {
        return { error: error.message };
    }
}

// Combined function from the original plan to get employee data
export async function getEmployeeData(payload: { employeeId: string; year: number; month: number; }) {
    if (!payload.employeeId) {
        return { error: 'Invalid employee ID provided.' };
    }
    const { employeeId, year, month } = payload;
    try {
        const workerDoc = await adminDb.collection(EMPLOYEE_COLLECTION).doc(employeeId).get();
        if (!workerDoc.exists) {
            return { error: 'Employee not found' };
        }
        const worker = { id: workerDoc.id, ...workerDoc.data() } as Worker;

        const payrollQuery = await adminDb.collection(EMPLOYEE_COLLECTION).doc(employeeId).collection('payroll')
            .where('year', '==', year)
            .where('month', '==', month)
            .limit(1)
            .get();

        const payrollHistory = payrollQuery.docs.map((doc: QueryDocumentSnapshot) => ({ ...doc.data() } as PayrollData));

        return { worker, payrollHistory };
    } catch (error: any) {
        return { error: error.message };
    }
}

// Function to get a single employee's details
export async function getEmployee(payload: { employeeId: string }) {
    if (!payload.employeeId) {
        return { error: 'Invalid employee ID provided.' };
    }
    try {
        const doc = await adminDb.collection(EMPLOYEE_COLLECTION).doc(payload.employeeId).get();
        if (!doc.exists) {
            return { error: 'Worker not found' };
        }
        const workerData = doc.data();
        // Convert hiringDate to a simple YYYY-MM-DD string for the client-side date input
        if (workerData?.hiringDate && workerData.hiringDate.toDate) {
            workerData.hiringDate = workerData.hiringDate.toDate().toISOString().split('T')[0];
        }

        return { worker: { id: doc.id, ...workerData } as Worker };
    } catch (error: any) {
        return { error: error.message };
    }
}

// Function to update an employee's data
export async function updateEmployee(payload: { employeeId: string; workerData: Partial<Worker> }) {
    if (!payload.employeeId) {
        return { error: 'Invalid employee ID provided.' };
    }

    const { employeeId, workerData } = payload;

    try {
        const dataToUpdate = { ...workerData };

        // ** CRITICAL FIX **
        // Ensure hiringDate is always stored as a Timestamp in Firestore.
        if (typeof dataToUpdate.hiringDate === 'string') {
            const jsDate = toJsDate(dataToUpdate.hiringDate);
            if (jsDate) {
                dataToUpdate.hiringDate = Timestamp.fromDate(jsDate);
            } else {
                // If the string is invalid, remove it to avoid writing a bad value.
                delete dataToUpdate.hiringDate;
            }
        } else if (dataToUpdate.hiringDate instanceof Date) {
            dataToUpdate.hiringDate = Timestamp.fromDate(dataToUpdate.hiringDate);
        }

        await adminDb.collection(EMPLOYEE_COLLECTION).doc(employeeId).update(dataToUpdate);
        return { success: true };
    } catch (error: any) {
        return { error: error.message };
    }
}

// Robust function to get monthly data for an employee. Always returns a valid object.
export async function getMonthlyData(payload: { employeeId: string; year: number; month: number; }) {
    const defaultData = { advances: 0, penalties: 0, commission: 0 };
    if (!payload.employeeId) {
        return defaultData;
    }
    try {
        const doc = await adminDb.collection(`salaries_${payload.year}_${payload.month + 1}`).doc(payload.employeeId).get();
        if (!doc.exists) {
            return defaultData;
        }
        return (doc.data() as MonthlyData) || defaultData;
    } catch (error: any) { 
        console.error("Error fetching monthly data:", error);
        return defaultData;
    }
}

// Function to save monthly data for an employee
export async function saveMonthlyData(payload: { employeeId: string; year: number; month: number; monthlyData: Partial<MonthlyData> }) {
    if (!payload.employeeId) {
        return { error: 'Invalid employee ID provided.' };
    }
    try {
        const { employeeId, year, month, monthlyData } = payload;
        await adminDb.collection(`salaries_${year}_${month + 1}`).doc(employeeId).set(monthlyData, { merge: true });
        return { success: true };
    } catch (error: any) {
        return { error: error.message };
    }
}
