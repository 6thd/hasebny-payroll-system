
"use server";

import { revalidatePath } from "next/cache";
import { adminDb as db } from "@/lib/firebase/admin";
import { type ServiceHistoryItem } from "@/types";
import { z } from "zod";

const settlementSchema = z.object({
  workerId: z.string().min(1, { message: "Worker ID cannot be empty." }),
  settlementType: z.enum(['EOS', 'LEAVE_SETTLEMENT']),
  settlementData: z.any(),
  companyId: z.string().min(1, { message: "Company ID cannot be empty." }),
});

export async function finalizeSettlement(formData: FormData) {
  const rawData = Object.fromEntries(formData.entries());
  const validation = settlementSchema.safeParse(rawData);

  if (!validation.success) {
    // Extract and format errors from Zod
    const errorMessages = validation.error.errors.map(e => `${e.path.join('.')} - ${e.message}`).join(", ");
    return { success: false, error: `Invalid data provided: ${errorMessages}` };
  }

  const { workerId, settlementType, settlementData, companyId } = validation.data;

  try {
    const parsedSettlementData = JSON.parse(settlementData);

    const batch = db.batch();

    const workerRef = db.collection("employees").doc(workerId);

    // 1. Update worker status
    if (settlementType === 'EOS') {
      batch.update(workerRef, { 
        status: 'Terminated', 
        terminationDate: parsedSettlementData.endDate 
      });
    } else if (settlementType === 'LEAVE_SETTLEMENT') {
      batch.update(workerRef, { 
        'leaveBalance.lastSettlementDate': parsedSettlementData.calculationDate 
      });
    }

    // 2. Add to service history
    const serviceHistoryRef = workerRef.collection('serviceHistory').doc();
    
    let historyItem: Omit<ServiceHistoryItem, 'id'>;

    if (settlementType === 'EOS') {
        historyItem = {
            type: "EndOfService",
            startDate: parsedSettlementData.startDate,
            endDate: parsedSettlementData.endDate,
            jobTitle: parsedSettlementData.jobTitle, // Assuming these are part of the settlementData
            salary: parsedSettlementData.finalSalary, // Assuming final salary is passed
            details: JSON.stringify(parsedSettlementData.breakdown),
            finalizedAt: parsedSettlementData.endDate, // Or calculation date
            totalAmount: parsedSettlementData.totalCompensation,
        };
    } else { // LEAVE_SETTLEMENT
        historyItem = {
            type: "LeaveSettlement",
            startDate: parsedSettlementData.calculationBasis.periodStartDate,
            endDate: parsedSettlementData.calculationBasis.periodEndDate,
            jobTitle: parsedSettlementData.worker?.jobTitle || 'N/A',
            salary: parsedSettlementData.worker?.salary || 0,
            details: JSON.stringify(parsedSettlementData.calculationBasis),
            finalizedAt: parsedSettlementData.calculationDate,
            totalAmount: parsedSettlementData.monetaryValue,
            monetaryValue: parsedSettlementData.monetaryValue,
        };
    }

    const serviceHistoryItem: ServiceHistoryItem = {
        id: serviceHistoryRef.id,
        ...historyItem,
    };

    batch.set(serviceHistoryRef, serviceHistoryItem);

    await batch.commit();

    revalidatePath('/');
    revalidatePath('/settlements');

    return { success: true, message: "Settlement finalized successfully." };

  } catch (error) {
    console.error("Error finalizing settlement:", error);
    return { success: false, error: "Failed to finalize settlement." };
  }
}
