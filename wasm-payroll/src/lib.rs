use wasm_bindgen::prelude::*;
use serde::{Deserialize, Serialize};

// Define the Worker data structure that matches the TypeScript interface
#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Worker {
    pub id: String,
    pub name: String,
    pub basic_salary: f64,
    pub housing: f64,
    pub work_nature: f64,
    pub transport: f64,
    pub phone: f64,
    pub food: f64,
    pub commission: Option<f64>,
    pub advances: Option<f64>,
    pub penalties: Option<f64>,
    pub total_overtime: Option<f64>,
    pub absent_days: Option<f64>,
    pub annual_leave_days: Option<f64>,
    pub sick_leave_days: Option<f64>,
}

// Define the PayrollData structure that matches the TypeScript interface
#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct PayrollData {
    pub overtime_pay: f64,
    pub absence_deduction: f64,
    pub net_salary: f64,
    pub total_allowances: f64,
    pub gross_salary: f64,
    pub total_deductions: f64,
}

// Constants
const REGULAR_HOURS_PER_DAY: f64 = 8.0;

#[wasm_bindgen]
extern "C" {
    // Use the `js_namespace` here to bind `console.log(..)` instead of just
    // `log(..)`
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

#[wasm_bindgen]
pub fn calculate_payroll(worker: &JsValue, year: i32, month: i32) -> JsValue {
    // Convert JsValue to our Worker struct
    let worker: Worker = worker.into_serde().unwrap();
    
    // Perform the payroll calculation
    let result = calculate_payroll_internal(worker, year, month);
    
    // Convert result back to JsValue
    JsValue::from_serde(&result).unwrap()
}

fn calculate_payroll_internal(worker: Worker, _year: i32, _month: i32) -> PayrollData {
    // 1. Calculate total allowances (without overtime) to be the basis for deduction
    let total_allowances = (worker.housing) + (worker.work_nature) + (worker.transport) + 
                          (worker.phone) + (worker.food) + (worker.commission.unwrap_or(0.0));
    let deductible_gross_salary = (worker.basic_salary) + total_allowances;
    
    // 2. Calculate daily rate
    //    (Always divided by 30 according to Saudi payroll systems)
    let daily_rate = deductible_gross_salary / 30.0;
    
    // 3. Calculate absence and leave deduction value
    let hourly_rate = ((worker.basic_salary) / 30.0) / REGULAR_HOURS_PER_DAY; // Overtime pay is calculated on basic only
    let overtime_pay = (worker.total_overtime.unwrap_or(0.0)) * hourly_rate * 1.5;
    let absence_and_leave_days = (worker.absent_days.unwrap_or(0.0)) + 
                                (worker.annual_leave_days.unwrap_or(0.0)) + 
                                (worker.sick_leave_days.unwrap_or(0.0));
    let absence_deduction = daily_rate * absence_and_leave_days;

    // 4. Calculate total entitlements
    let gross_salary = deductible_gross_salary + overtime_pay;

    // 5. Calculate total deductions
    let total_deductions = absence_deduction + (worker.advances.unwrap_or(0.0)) + (worker.penalties.unwrap_or(0.0));
    
    // 6. Calculate net salary
    let net_salary = gross_salary - total_deductions;
    
    PayrollData { 
        overtime_pay: (overtime_pay * 100.0).round() / 100.0,
        absence_deduction: (absence_deduction * 100.0).round() / 100.0,
        net_salary: (net_salary * 100.0).round() / 100.0,
        total_allowances: (total_allowances * 100.0).round() / 100.0,
        gross_salary: (gross_salary * 100.0).round() / 100.0,
        total_deductions: (total_deductions * 100.0).round() / 100.0,
    }
}

#[wasm_bindgen]
pub fn calculate_multiple_payrolls(workers: &JsValue) -> JsValue {
    // Convert JsValue to Vec<Worker>
    let workers: Vec<Worker> = workers.into_serde().unwrap();
    
    // Calculate payroll for each worker
    let results: Vec<PayrollData> = workers.into_iter()
        .map(|worker| calculate_payroll_internal(worker, 0, 0)) // Year and month not used in this context
        .collect();
    
    // Convert results back to JsValue
    JsValue::from_serde(&results).unwrap()
}

// A simple function to demonstrate performance improvement
#[wasm_bindgen]
pub fn calculate_bulk_payroll_simulation(count: i32) -> f64 {
    let mut total = 0.0;
    for i in 0..count {
        let worker = Worker {
            id: format!("emp_{}", i),
            name: format!("Employee {}", i),
            basic_salary: 5000.0 + (i as f64) * 100.0,
            housing: 1000.0,
            work_nature: 500.0,
            transport: 300.0,
            phone: 100.0,
            food: 200.0,
            commission: Some(0.0),
            advances: Some(0.0),
            penalties: Some(0.0),
            total_overtime: Some((i as f64) * 2.0),
            absent_days: Some((i % 5) as f64),
            annual_leave_days: Some((i % 3) as f64),
            sick_leave_days: Some((i % 2) as f64),
        };
        
        let payroll = calculate_payroll_internal(worker, 2023, 1);
        total += payroll.net_salary;
    }
    total
}