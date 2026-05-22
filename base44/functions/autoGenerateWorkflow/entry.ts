import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const DEFAULT_TASKS = [
  // PHASE 1 — PRODUCT PREPARATION
  // Stage 1 — Product Sourcing
  { phase_number: 1, phase_name: 'PRODUCT PREPARATION', stage_number: 1, stage_name: 'Product Sourcing', task_name: 'Identify potential collectives from partner operators', department: 'product_development', priority: 'high', order_index: 1 },
  { phase_number: 1, phase_name: 'PRODUCT PREPARATION', stage_number: 1, stage_name: 'Product Sourcing', task_name: 'Check marketability and demand of the destination', department: 'product_development', priority: 'high', order_index: 2 },
  { phase_number: 1, phase_name: 'PRODUCT PREPARATION', stage_number: 1, stage_name: 'Product Sourcing', task_name: 'Compare competitor pricing', department: 'product_development', priority: 'medium', order_index: 3 },
  { phase_number: 1, phase_name: 'PRODUCT PREPARATION', stage_number: 1, stage_name: 'Product Sourcing', task_name: 'Review operator reputation and reliability', department: 'product_development', priority: 'medium', order_index: 4 },
  { phase_number: 1, phase_name: 'PRODUCT PREPARATION', stage_number: 1, stage_name: 'Product Sourcing', task_name: 'Request complete package details from operator: Inclusions', department: 'product_development', priority: 'high', order_index: 5 },
  { phase_number: 1, phase_name: 'PRODUCT PREPARATION', stage_number: 1, stage_name: 'Product Sourcing', task_name: 'Request complete package details from operator: Exclusions', department: 'product_development', priority: 'high', order_index: 6 },
  { phase_number: 1, phase_name: 'PRODUCT PREPARATION', stage_number: 1, stage_name: 'Product Sourcing', task_name: 'Request complete package details from operator: Flight details', department: 'product_development', priority: 'high', order_index: 7 },
  { phase_number: 1, phase_name: 'PRODUCT PREPARATION', stage_number: 1, stage_name: 'Product Sourcing', task_name: 'Request complete package details from operator: Hotel details', department: 'product_development', priority: 'high', order_index: 8 },
  { phase_number: 1, phase_name: 'PRODUCT PREPARATION', stage_number: 1, stage_name: 'Product Sourcing', task_name: 'Request complete package details from operator: Terms & conditions', department: 'product_development', priority: 'medium', order_index: 9 },
  { phase_number: 1, phase_name: 'PRODUCT PREPARATION', stage_number: 1, stage_name: 'Product Sourcing', task_name: 'Request complete package details from operator: Payment deadlines', department: 'product_development', priority: 'high', order_index: 10 },
  { phase_number: 1, phase_name: 'PRODUCT PREPARATION', stage_number: 1, stage_name: 'Product Sourcing', task_name: 'Request complete package details from operator: Cancellation policy', department: 'product_development', priority: 'medium', order_index: 11 },
  { phase_number: 1, phase_name: 'PRODUCT PREPARATION', stage_number: 1, stage_name: 'Product Sourcing', task_name: 'Request complete package details from operator: Agent Commission', department: 'product_development', priority: 'high', order_index: 12 },
  { phase_number: 1, phase_name: 'PRODUCT PREPARATION', stage_number: 1, stage_name: 'Product Sourcing', task_name: 'Confirm commission structure', department: 'product_development', priority: 'high', order_index: 13 },
  { phase_number: 1, phase_name: 'PRODUCT PREPARATION', stage_number: 1, stage_name: 'Product Sourcing', task_name: 'Confirm guaranteed departure status', department: 'product_development', priority: 'medium', order_index: 14 },
  { phase_number: 1, phase_name: 'PRODUCT PREPARATION', stage_number: 1, stage_name: 'Product Sourcing', task_name: 'Confirm seat/blocking allocation availability', department: 'product_development', priority: 'high', order_index: 15 },
  // Stage 2 — Product Evaluation & Approval
  { phase_number: 1, phase_name: 'PRODUCT PREPARATION', stage_number: 2, stage_name: 'Product Evaluation & Approval', task_name: 'Evaluate profitability and commission margin', department: 'product_development', priority: 'high', requires_approval: true, order_index: 1 },
  { phase_number: 1, phase_name: 'PRODUCT PREPARATION', stage_number: 2, stage_name: 'Product Evaluation & Approval', task_name: 'Review selling price competitiveness', department: 'product_development', priority: 'high', order_index: 2 },
  { phase_number: 1, phase_name: 'PRODUCT PREPARATION', stage_number: 2, stage_name: 'Product Evaluation & Approval', task_name: 'Check risk exposure and operator credibility', department: 'management', priority: 'high', order_index: 3 },
  { phase_number: 1, phase_name: 'PRODUCT PREPARATION', stage_number: 2, stage_name: 'Product Evaluation & Approval', task_name: 'Review payment schedules and deadlines', department: 'management', priority: 'urgent', order_index: 4 },
  { phase_number: 1, phase_name: 'PRODUCT PREPARATION', stage_number: 2, stage_name: 'Product Evaluation & Approval', task_name: 'Approve product for selling', department: 'management', priority: 'urgent', requires_approval: true, order_index: 5 },
  // Stage 3 — Product Creation
  { phase_number: 1, phase_name: 'PRODUCT PREPARATION', stage_number: 3, stage_name: 'Product Creation', task_name: 'Create internal EZquote', department: 'product_development', priority: 'high', order_index: 1 },
  { phase_number: 1, phase_name: 'PRODUCT PREPARATION', stage_number: 3, stage_name: 'Product Creation', task_name: 'Add mark-up/buffer', department: 'product_development', priority: 'high', order_index: 2 },
  { phase_number: 1, phase_name: 'PRODUCT PREPARATION', stage_number: 3, stage_name: 'Product Creation', task_name: 'Convert rates into peso if applicable', department: 'product_development', priority: 'high', order_index: 3 },
  { phase_number: 1, phase_name: 'PRODUCT PREPARATION', stage_number: 3, stage_name: 'Product Creation', task_name: 'Add buffer for currency exchange', department: 'product_development', priority: 'medium', order_index: 4 },
  { phase_number: 1, phase_name: 'PRODUCT PREPARATION', stage_number: 3, stage_name: 'Product Creation', task_name: 'Prepare internal costing', department: 'product_development', priority: 'high', order_index: 5 },
  { phase_number: 1, phase_name: 'PRODUCT PREPARATION', stage_number: 3, stage_name: 'Product Creation', task_name: 'Create optional tour list', department: 'product_development', priority: 'medium', order_index: 6 },
  { phase_number: 1, phase_name: 'PRODUCT PREPARATION', stage_number: 3, stage_name: 'Product Creation', task_name: 'Prepare terms and conditions', department: 'product_development', priority: 'medium', order_index: 7 },
  // Stage 4 — Internal Documentation
  { phase_number: 1, phase_name: 'PRODUCT PREPARATION', stage_number: 4, stage_name: 'Internal Documentation', task_name: 'Save operator tariff in Google Drive', department: 'admin', priority: 'high', order_index: 1 },
  { phase_number: 1, phase_name: 'PRODUCT PREPARATION', stage_number: 4, stage_name: 'Internal Documentation', task_name: 'Save operator contact details', department: 'admin', priority: 'medium', order_index: 2 },
  { phase_number: 1, phase_name: 'PRODUCT PREPARATION', stage_number: 4, stage_name: 'Internal Documentation', task_name: 'Save payment deadlines', department: 'admin', priority: 'high', order_index: 3 },
  { phase_number: 1, phase_name: 'PRODUCT PREPARATION', stage_number: 4, stage_name: 'Internal Documentation', task_name: 'Save operator posters and materials', department: 'admin', priority: 'medium', order_index: 4 },
  { phase_number: 1, phase_name: 'PRODUCT PREPARATION', stage_number: 4, stage_name: 'Internal Documentation', task_name: 'Update destination tracker', department: 'admin', priority: 'high', order_index: 5 },
  { phase_number: 1, phase_name: 'PRODUCT PREPARATION', stage_number: 4, stage_name: 'Internal Documentation', task_name: 'Update collective monitoring tracker', department: 'admin', priority: 'high', order_index: 6 },
  // Stage 5 — Upload in Collectives Tracker
  { phase_number: 1, phase_name: 'PRODUCT PREPARATION', stage_number: 5, stage_name: 'Upload in Collectives Tracker', task_name: 'Upload collective package to Google Drive', department: 'product_development', priority: 'high', order_index: 1 },
  { phase_number: 1, phase_name: 'PRODUCT PREPARATION', stage_number: 5, stage_name: 'Upload in Collectives Tracker', task_name: 'Encode departure dates', department: 'product_development', priority: 'high', order_index: 2 },
  { phase_number: 1, phase_name: 'PRODUCT PREPARATION', stage_number: 5, stage_name: 'Upload in Collectives Tracker', task_name: 'Encode pricing', department: 'product_development', priority: 'high', order_index: 3 },
  { phase_number: 1, phase_name: 'PRODUCT PREPARATION', stage_number: 5, stage_name: 'Upload in Collectives Tracker', task_name: 'Encode flight details', department: 'product_development', priority: 'high', order_index: 4 },
  { phase_number: 1, phase_name: 'PRODUCT PREPARATION', stage_number: 5, stage_name: 'Upload in Collectives Tracker', task_name: 'Encode available slots', department: 'product_development', priority: 'high', order_index: 5 },
  { phase_number: 1, phase_name: 'PRODUCT PREPARATION', stage_number: 5, stage_name: 'Upload in Collectives Tracker', task_name: 'Encode payment deadlines', department: 'product_development', priority: 'urgent', order_index: 6 },
  { phase_number: 1, phase_name: 'PRODUCT PREPARATION', stage_number: 5, stage_name: 'Upload in Collectives Tracker', task_name: 'Add remarks and booking conditions', department: 'product_development', priority: 'medium', order_index: 7 },
  // Stage 6 — Marketing Endorsement
  { phase_number: 1, phase_name: 'PRODUCT PREPARATION', stage_number: 6, stage_name: 'Marketing Endorsement', task_name: 'Receive finalized package details', department: 'marketing', priority: 'high', order_index: 1 },
  { phase_number: 1, phase_name: 'PRODUCT PREPARATION', stage_number: 6, stage_name: 'Marketing Endorsement', task_name: 'Create official marketing poster if needed', department: 'marketing', priority: 'high', order_index: 2 },
  { phase_number: 1, phase_name: 'PRODUCT PREPARATION', stage_number: 6, stage_name: 'Marketing Endorsement', task_name: 'Prepare optional tour posters', department: 'marketing', priority: 'medium', order_index: 3 },
  { phase_number: 1, phase_name: 'PRODUCT PREPARATION', stage_number: 6, stage_name: 'Marketing Endorsement', task_name: 'Ensure itinerary visuals are accurate', department: 'marketing', priority: 'high', order_index: 4 },
  { phase_number: 1, phase_name: 'PRODUCT PREPARATION', stage_number: 6, stage_name: 'Marketing Endorsement', task_name: 'Prepare reels/videos aligned with itinerary only', department: 'marketing', priority: 'medium', order_index: 5 },
  { phase_number: 1, phase_name: 'PRODUCT PREPARATION', stage_number: 6, stage_name: 'Marketing Endorsement', task_name: 'Prepare social media captions', department: 'marketing', priority: 'medium', order_index: 6 },
  { phase_number: 1, phase_name: 'PRODUCT PREPARATION', stage_number: 6, stage_name: 'Marketing Endorsement', task_name: 'Prepare E-blast materials', department: 'marketing', priority: 'medium', order_index: 7 },
  // PHASE 2 — LAUNCHING
  { phase_number: 2, phase_name: 'LAUNCHING', stage_number: 7, stage_name: 'Product Launch', task_name: 'Endorse package in Product Update GC', department: 'product_development', priority: 'high', order_index: 1 },
  { phase_number: 2, phase_name: 'LAUNCHING', stage_number: 7, stage_name: 'Product Launch', task_name: 'Obtain acknowledgment from Sales Team', department: 'marketing', priority: 'high', order_index: 2 },
  { phase_number: 2, phase_name: 'LAUNCHING', stage_number: 7, stage_name: 'Product Launch', task_name: 'Make Product Update post', department: 'marketing', priority: 'high', order_index: 3 },
  { phase_number: 2, phase_name: 'LAUNCHING', stage_number: 7, stage_name: 'Product Launch', task_name: 'Upload/post to Facebook', department: 'marketing', priority: 'high', order_index: 4 },
  { phase_number: 2, phase_name: 'LAUNCHING', stage_number: 7, stage_name: 'Product Launch', task_name: 'Upload/post to Instagram', department: 'marketing', priority: 'high', order_index: 5 },
  { phase_number: 2, phase_name: 'LAUNCHING', stage_number: 7, stage_name: 'Product Launch', task_name: 'Upload/post to Website', department: 'marketing', priority: 'high', order_index: 6 },
  { phase_number: 2, phase_name: 'LAUNCHING', stage_number: 7, stage_name: 'Product Launch', task_name: 'Upload/post to Sub-agent groups (POTB)', department: 'marketing', priority: 'medium', order_index: 7 },
  { phase_number: 2, phase_name: 'LAUNCHING', stage_number: 7, stage_name: 'Product Launch', task_name: 'Release promotional materials', department: 'marketing', priority: 'medium', order_index: 8 },
  { phase_number: 2, phase_name: 'LAUNCHING', stage_number: 8, stage_name: 'Reservation & Slot Holding', task_name: 'Receive booking inquiry', department: 'sales', priority: 'high', order_index: 1 },
  { phase_number: 2, phase_name: 'LAUNCHING', stage_number: 8, stage_name: 'Reservation & Slot Holding', task_name: 'Coordinate with operator for slot availability', department: 'sales', priority: 'high', order_index: 2 },
  { phase_number: 2, phase_name: 'LAUNCHING', stage_number: 8, stage_name: 'Reservation & Slot Holding', task_name: 'Hold reservation if allowed by operator', department: 'admin', priority: 'high', order_index: 3 },
  { phase_number: 2, phase_name: 'LAUNCHING', stage_number: 8, stage_name: 'Reservation & Slot Holding', task_name: 'Check payment deadline', department: 'admin', priority: 'urgent', order_index: 4 },
  { phase_number: 2, phase_name: 'LAUNCHING', stage_number: 8, stage_name: 'Reservation & Slot Holding', task_name: 'Inform client of payment terms', department: 'sales', priority: 'high', order_index: 5 },
  // PHASE 3 — SALES
  { phase_number: 3, phase_name: 'SALES', stage_number: 9, stage_name: 'Payment Coordination', task_name: 'Collect downpayment/full payment from client', department: 'accounting', priority: 'urgent', order_index: 1 },
  { phase_number: 3, phase_name: 'SALES', stage_number: 9, stage_name: 'Payment Coordination', task_name: 'Coordinate payment deadline with Accounting', department: 'sales', priority: 'urgent', order_index: 2 },
  { phase_number: 3, phase_name: 'SALES', stage_number: 9, stage_name: 'Payment Coordination', task_name: 'Ensure payment processed BEFORE operator deadline', department: 'accounting', priority: 'urgent', order_index: 3 },
  { phase_number: 3, phase_name: 'SALES', stage_number: 9, stage_name: 'Payment Coordination', task_name: '⚠ STRICT RULE: Internal deadline must be earlier than supplier deadline', department: 'management', priority: 'urgent', order_index: 4 },
  { phase_number: 3, phase_name: 'SALES', stage_number: 9, stage_name: 'Payment Coordination', task_name: 'Set internal deadline 15–30 days before supplier deadline', department: 'admin', priority: 'urgent', order_index: 5 },
  { phase_number: 3, phase_name: 'SALES', stage_number: 10, stage_name: 'Booking Confirmation', task_name: 'Send passenger details to operator', department: 'admin', priority: 'urgent', order_index: 1 },
  { phase_number: 3, phase_name: 'SALES', stage_number: 10, stage_name: 'Booking Confirmation', task_name: 'Secure booking confirmation', department: 'admin', priority: 'urgent', order_index: 2 },
  { phase_number: 3, phase_name: 'SALES', stage_number: 10, stage_name: 'Booking Confirmation', task_name: 'Request booking reference', department: 'admin', priority: 'high', order_index: 3 },
  { phase_number: 3, phase_name: 'SALES', stage_number: 10, stage_name: 'Booking Confirmation', task_name: 'Update slot inventory tracker', department: 'admin', priority: 'high', order_index: 4 },
  // PHASE 4 — DOCUMENTATION
  { phase_number: 4, phase_name: 'DOCUMENTATION', stage_number: 11, stage_name: 'Documentation', task_name: 'Collect passport copies/documents', department: 'visa', priority: 'urgent', order_index: 1 },
  { phase_number: 4, phase_name: 'DOCUMENTATION', stage_number: 11, stage_name: 'Documentation', task_name: 'Assist with visa requirements if applicable', department: 'visa', priority: 'urgent', order_index: 2 },
  { phase_number: 4, phase_name: 'DOCUMENTATION', stage_number: 11, stage_name: 'Documentation', task_name: 'Send reminders for lacking requirements', department: 'visa', priority: 'urgent', order_index: 3 },
  { phase_number: 4, phase_name: 'DOCUMENTATION', stage_number: 11, stage_name: 'Documentation', task_name: 'Send travel reminders and confirmations', department: 'admin', priority: 'high', order_index: 4 },
  // PHASE 5 — PRE-DEPARTURE & ONGOING TRAVEL
  { phase_number: 5, phase_name: 'PRE-DEPARTURE & ONGOING TRAVEL', stage_number: 12, stage_name: 'Pre-Departure Coordination', task_name: 'Reconfirm booking with operator', department: 'operations', priority: 'urgent', order_index: 1 },
  { phase_number: 5, phase_name: 'PRE-DEPARTURE & ONGOING TRAVEL', stage_number: 12, stage_name: 'Pre-Departure Coordination', task_name: 'Request final itinerary', department: 'operations', priority: 'high', order_index: 2 },
  { phase_number: 5, phase_name: 'PRE-DEPARTURE & ONGOING TRAVEL', stage_number: 12, stage_name: 'Pre-Departure Coordination', task_name: 'Request emergency contact details', department: 'admin', priority: 'high', order_index: 3 },
  { phase_number: 5, phase_name: 'PRE-DEPARTURE & ONGOING TRAVEL', stage_number: 12, stage_name: 'Pre-Departure Coordination', task_name: 'Send travel vouchers to clients', department: 'admin', priority: 'high', order_index: 4 },
  { phase_number: 5, phase_name: 'PRE-DEPARTURE & ONGOING TRAVEL', stage_number: 12, stage_name: 'Pre-Departure Coordination', task_name: 'Coordinate special requests if any', department: 'operations', priority: 'medium', order_index: 5 },
  { phase_number: 5, phase_name: 'PRE-DEPARTURE & ONGOING TRAVEL', stage_number: 13, stage_name: 'During Travel', task_name: 'Monitor trip status', department: 'operations', priority: 'urgent', order_index: 1 },
  { phase_number: 5, phase_name: 'PRE-DEPARTURE & ONGOING TRAVEL', stage_number: 13, stage_name: 'During Travel', task_name: 'Coordinate during emergencies/disruptions', department: 'operations', priority: 'urgent', order_index: 2 },
  { phase_number: 5, phase_name: 'PRE-DEPARTURE & ONGOING TRAVEL', stage_number: 13, stage_name: 'During Travel', task_name: 'Monitor client satisfaction during trip', department: 'sales', priority: 'high', order_index: 3 },
  // PHASE 6 — SALES INCOME
  { phase_number: 6, phase_name: 'SALES INCOME', stage_number: 14, stage_name: 'Post-Travel Evaluation', task_name: 'Record number of pax sold', department: 'sales', priority: 'high', order_index: 1 },
  { phase_number: 6, phase_name: 'SALES INCOME', stage_number: 14, stage_name: 'Post-Travel Evaluation', task_name: 'Record total revenue generated', department: 'accounting', priority: 'high', order_index: 2 },
  { phase_number: 6, phase_name: 'SALES INCOME', stage_number: 14, stage_name: 'Post-Travel Evaluation', task_name: 'Record total commission earned', department: 'accounting', priority: 'high', order_index: 3 },
  { phase_number: 6, phase_name: 'SALES INCOME', stage_number: 14, stage_name: 'Post-Travel Evaluation', task_name: 'Conduct profitability review', department: 'management', priority: 'high', requires_approval: true, order_index: 4 },
  { phase_number: 6, phase_name: 'SALES INCOME', stage_number: 14, stage_name: 'Post-Travel Evaluation', task_name: 'Document recommendations for future selling', department: 'management', priority: 'medium', order_index: 5 },
  // PHASE 7 — CLIENT EVALUATION
  { phase_number: 7, phase_name: 'CLIENT EVALUATION', stage_number: 15, stage_name: 'Post-Trip Evaluation & Client Feedback', task_name: 'Send post-trip evaluation form/survey within 3–5 days', department: 'admin', priority: 'high', order_index: 1 },
  { phase_number: 7, phase_name: 'CLIENT EVALUATION', stage_number: 15, stage_name: 'Post-Trip Evaluation & Client Feedback', task_name: 'Survey: Hotel Experience', department: 'admin', priority: 'medium', order_index: 2 },
  { phase_number: 7, phase_name: 'CLIENT EVALUATION', stage_number: 15, stage_name: 'Post-Trip Evaluation & Client Feedback', task_name: 'Survey: Tour quality', department: 'admin', priority: 'medium', order_index: 3 },
  { phase_number: 7, phase_name: 'CLIENT EVALUATION', stage_number: 15, stage_name: 'Post-Trip Evaluation & Client Feedback', task_name: 'Survey: Flight Experience', department: 'admin', priority: 'medium', order_index: 4 },
  { phase_number: 7, phase_name: 'CLIENT EVALUATION', stage_number: 15, stage_name: 'Post-Trip Evaluation & Client Feedback', task_name: 'Survey: Tour guide service', department: 'admin', priority: 'medium', order_index: 5 },
  { phase_number: 7, phase_name: 'CLIENT EVALUATION', stage_number: 15, stage_name: 'Post-Trip Evaluation & Client Feedback', task_name: 'Survey: Transfers and transportation', department: 'admin', priority: 'medium', order_index: 6 },
  { phase_number: 7, phase_name: 'CLIENT EVALUATION', stage_number: 15, stage_name: 'Post-Trip Evaluation & Client Feedback', task_name: 'Survey: Optional tours', department: 'admin', priority: 'medium', order_index: 7 },
  { phase_number: 7, phase_name: 'CLIENT EVALUATION', stage_number: 15, stage_name: 'Post-Trip Evaluation & Client Feedback', task_name: 'Survey: Overall satisfaction', department: 'admin', priority: 'high', order_index: 8 },
  { phase_number: 7, phase_name: 'CLIENT EVALUATION', stage_number: 15, stage_name: 'Post-Trip Evaluation & Client Feedback', task_name: 'Survey: Suggestions and improvements', department: 'admin', priority: 'medium', order_index: 9 },
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    // Support both direct calls {collective_id} and entity automation payloads {event, data}
    const collective_id = body.collective_id || body.event?.entity_id || body.data?.id;
    const force_regenerate = body.force_regenerate || false;

    if (!collective_id) {
      return Response.json({ error: 'collective_id is required' }, { status: 400 });
    }

    // Check if workflow already exists for this collective
    const existing = await base44.asServiceRole.entities.ChecklistTask.filter({ collective_id });
    
    if (existing.length > 0 && !force_regenerate) {
      return Response.json({ 
        message: 'Workflow already exists', 
        task_count: existing.length,
        already_existed: true 
      });
    }

    // If force_regenerate, delete existing tasks first
    if (force_regenerate && existing.length > 0) {
      for (const task of existing) {
        await base44.asServiceRole.entities.ChecklistTask.delete(task.id);
      }
    }

    // Generate all tasks for this collective
    const tasksToCreate = DEFAULT_TASKS.map(t => ({
      ...t,
      collective_id,
      status: 'pending',
      is_template: false,
    }));

    await base44.asServiceRole.entities.ChecklistTask.bulkCreate(tasksToCreate);

    // Update collective to mark workflow as initialized
    await base44.asServiceRole.entities.Collective.update(collective_id, {
      current_phase: 1,
      current_stage: 1,
      checklist_completion: 0,
    });

    return Response.json({
      success: true,
      task_count: tasksToCreate.length,
      message: `Auto-generated ${tasksToCreate.length} workflow tasks across 7 phases and 15 stages`,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});