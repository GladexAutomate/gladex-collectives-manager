import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * SMART WORKFLOW AUTO-COMPLETION ENGINE
 * Maps real system actions to checklist task names and auto-completes them.
 * Called by entity automations on Collective, MarketingAsset, Booking, Payment, Document changes.
 */

// ── TASK COMPLETION RULES ─────────────────────────────────────────────────────
// Each rule defines: which entity event triggers it + which task name patterns to auto-complete.
// Pattern matching is case-insensitive substring match against task_name.

function getCompletionRules(entity, data, oldData) {
  const rules = [];

  // ── COLLECTIVE updated / created ──────────────────────────────────────────
  if (entity === 'Collective') {
    const collective_id = data.id;

    // Package creation = Stage 3 & 5 Product Creation tasks
    rules.push({
      collective_id,
      taskPatterns: ['create internal ezquote', 'prepare internal costing'],
      reason: 'Collective package created',
    });

    // Pricing encoded
    if (data.selling_price || data.base_price || data.base_price_php) {
      rules.push({
        collective_id,
        taskPatterns: ['encode pricing', 'add mark-up', 'convert rates', 'add buffer for currency'],
        reason: 'Pricing encoded on collective',
      });
    }

    // Flight details encoded
    if (data.flight_details) {
      rules.push({
        collective_id,
        taskPatterns: ['encode flight details', 'request complete package details from operator: flight details'],
        reason: 'Flight details filled in',
      });
    }

    // Departure dates encoded
    if (data.departure_date || (data.travel_dates && data.travel_dates.length > 0)) {
      rules.push({
        collective_id,
        taskPatterns: ['encode departure dates', 'confirm seat/blocking allocation'],
        reason: 'Departure dates encoded',
      });
    }

    // Hotel details
    if (data.hotel_details) {
      rules.push({
        collective_id,
        taskPatterns: ['request complete package details from operator: hotel details'],
        reason: 'Hotel details filled in',
      });
    }

    // Inclusions / Exclusions / T&C
    if (data.inclusions) {
      rules.push({
        collective_id,
        taskPatterns: ['request complete package details from operator: inclusions'],
        reason: 'Inclusions filled in',
      });
    }
    if (data.exclusions) {
      rules.push({
        collective_id,
        taskPatterns: ['request complete package details from operator: exclusions'],
        reason: 'Exclusions filled in',
      });
    }
    if (data.terms_conditions) {
      rules.push({
        collective_id,
        taskPatterns: ['request complete package details from operator: terms', 'prepare terms and conditions'],
        reason: 'Terms & conditions filled in',
      });
    }
    if (data.cancellation_policy) {
      rules.push({
        collective_id,
        taskPatterns: ['request complete package details from operator: cancellation'],
        reason: 'Cancellation policy filled in',
      });
    }

    // Commission
    if (data.commission_amount) {
      rules.push({
        collective_id,
        taskPatterns: ['request complete package details from operator: agent commission', 'confirm commission structure'],
        reason: 'Commission amount set',
      });
    }

    // Available slots
    if (data.total_slots) {
      rules.push({
        collective_id,
        taskPatterns: ['encode available slots', 'confirm seat/blocking allocation availability'],
        reason: 'Slots encoded',
      });
    }

    // Payment deadlines
    if (data.internal_deadline || data.supplier_deadline) {
      rules.push({
        collective_id,
        taskPatterns: [
          'encode payment deadlines',
          'request complete package details from operator: payment deadlines',
          'save payment deadlines',
          'set internal deadline',
        ],
        reason: 'Payment deadlines set',
      });
    }

    // Remarks
    if (data.remarks) {
      rules.push({
        collective_id,
        taskPatterns: ['add remarks and booking conditions'],
        reason: 'Remarks added',
      });
    }

    // Optional tours
    if (data.optional_tours) {
      rules.push({
        collective_id,
        taskPatterns: ['create optional tour list'],
        reason: 'Optional tours added',
      });
    }

    // Guaranteed departure confirmed
    if (data.guaranteed_departure === true) {
      rules.push({
        collective_id,
        taskPatterns: ['confirm guaranteed departure status'],
        reason: 'Guaranteed departure confirmed',
      });
    }

    // Operator info
    if (data.operator_name) {
      rules.push({
        collective_id,
        taskPatterns: ['save operator contact details'],
        reason: 'Operator name set',
      });
    }

    // When status moves to active or beyond = package approved for sales
    if (data.status && ['active','open_booking','confirmed_departure','ongoing','completed'].includes(data.status)) {
      rules.push({
        collective_id,
        taskPatterns: ['evaluate profitability', 'review selling price competitiveness'],
        reason: 'Collective moved to open booking or beyond',
      });
      rules.push({
        collective_id,
        taskPatterns: [
          'approve product for selling',
          'identify potential collectives',
          'check marketability',
          'compare competitor pricing',
          'review operator reputation',
          'save operator tariff',
          'update destination tracker',
          'update collective monitoring tracker',
          'upload collective package',
          'endorse package in product update',
          'receive finalized package details',
        ],
        reason: 'Package open for booking / launched',
      });
    }

    // Confirmed departure
    if (data.status && ['confirmed_departure','ongoing','completed'].includes(data.status)) {
      rules.push({
        collective_id,
        taskPatterns: ['reconfirm booking with operator', 'send passenger details to operator', 'secure booking confirmation'],
        reason: 'Departure confirmed',
      });
    }

    // Ongoing travel
    if (data.status === 'ongoing') {
      rules.push({
        collective_id,
        taskPatterns: ['request final itinerary', 'coordinate special requests', 'send travel vouchers', 'request emergency contact'],
        reason: 'Travel ongoing',
      });
    }

    // Completed travel
    if (data.status === 'completed') {
      rules.push({
        collective_id,
        taskPatterns: ['monitor trip status', 'coordinate during emergencies', 'monitor client satisfaction', 'record number of pax sold', 'record total revenue'],
        reason: 'Trip completed',
      });
    }

    // Image uploaded
    if (data.image_url) {
      rules.push({
        collective_id,
        taskPatterns: ['save operator posters and materials'],
        reason: 'Package image uploaded',
      });
    }
  }

  // ── MARKETING ASSET created / updated ─────────────────────────────────────
  if (entity === 'MarketingAsset') {
    const collective_id = data.collective_id;
    if (!collective_id) return rules;

    const assetType = data.asset_type;
    const status = data.status;
    const platforms = data.platform || [];

    // Any asset created/uploaded
    rules.push({
      collective_id,
      taskPatterns: ['receive finalized package details'],
      reason: 'Marketing asset created',
    });

    // Poster
    if (assetType === 'poster') {
      rules.push({
        collective_id,
        taskPatterns: ['create official marketing poster', 'prepare optional tour posters', 'ensure itinerary visuals are accurate'],
        reason: 'Poster uploaded',
      });
    }

    // Reel / video
    if (assetType === 'reel' || assetType === 'video') {
      rules.push({
        collective_id,
        taskPatterns: ['prepare reels/videos'],
        reason: 'Reel/video uploaded',
      });
    }

    // Caption / social
    if (assetType === 'caption') {
      rules.push({
        collective_id,
        taskPatterns: ['prepare social media captions'],
        reason: 'Caption prepared',
      });
    }

    // E-blast / brochure
    if (assetType === 'e_blast' || assetType === 'brochure') {
      rules.push({
        collective_id,
        taskPatterns: ['prepare e-blast materials'],
        reason: 'E-blast/brochure prepared',
      });
    }

    // Published assets = platform posts
    if (status === 'published') {
      rules.push({
        collective_id,
        taskPatterns: ['release promotional materials', 'make product update post'],
        reason: 'Marketing asset published',
      });
      if (platforms.includes('facebook')) {
        rules.push({ collective_id, taskPatterns: ['upload/post to facebook'], reason: 'Published to Facebook' });
      }
      if (platforms.includes('instagram')) {
        rules.push({ collective_id, taskPatterns: ['upload/post to instagram'], reason: 'Published to Instagram' });
      }
      if (platforms.includes('website')) {
        rules.push({ collective_id, taskPatterns: ['upload/post to website'], reason: 'Published to Website' });
      }
      if (platforms.includes('email')) {
        rules.push({ collective_id, taskPatterns: ['upload/post to sub-agent'], reason: 'Published via email/sub-agent' });
      }
    }
  }

  // ── BOOKING created / updated ──────────────────────────────────────────────
  if (entity === 'Booking') {
    const collective_id = data.collective_id;
    if (!collective_id) return rules;

    const bookingStatus = data.status;

    // Any booking = inquiry received
    rules.push({
      collective_id,
      taskPatterns: [
        'receive booking inquiry',
        'coordinate with operator for slot availability',
        'obtain acknowledgment from sales team',
      ],
      reason: 'Booking inquiry received',
    });

    // Slot held
    if (['slot_held', 'confirmed', 'paid', 'completed'].includes(bookingStatus)) {
      rules.push({
        collective_id,
        taskPatterns: [
          'hold reservation if allowed',
          'check payment deadline',
          'inform client of payment terms',
          'coordinate payment deadline',
        ],
        reason: 'Slot held / reservation made',
      });
    }

    // Confirmed booking
    if (['confirmed', 'paid', 'completed'].includes(bookingStatus)) {
      rules.push({
        collective_id,
        taskPatterns: [
          'send passenger details to operator',
          'secure booking confirmation',
          'request booking reference',
          'update slot inventory tracker',
        ],
        reason: 'Booking confirmed',
      });
    }

    // Full payment paid
    if (data.full_payment_paid === true) {
      rules.push({
        collective_id,
        taskPatterns: [
          'collect downpayment/full payment from client',
          'ensure payment processed before operator deadline',
          'record number of pax sold',
        ],
        reason: 'Full payment completed',
      });
    }

    // Downpayment paid
    if (data.downpayment_paid === true) {
      rules.push({
        collective_id,
        taskPatterns: ['collect downpayment/full payment from client'],
        reason: 'Downpayment paid',
      });
    }
  }

  // ── PAYMENT created / updated ──────────────────────────────────────────────
  if (entity === 'Payment') {
    const collective_id = data.collective_id;
    if (!collective_id) return rules;

    const payStatus = data.status;
    const payType = data.payment_type;

    // Any payment uploaded
    rules.push({
      collective_id,
      taskPatterns: ['collect downpayment/full payment from client', 'coordinate payment deadline'],
      reason: 'Payment recorded',
    });

    // Verified payment
    if (payStatus === 'verified') {
      rules.push({
        collective_id,
        taskPatterns: [
          'ensure payment processed before operator deadline',
          'record total revenue generated',
          'record total commission earned',
        ],
        reason: 'Payment verified',
      });
    }

    // Full payment verified
    if (payStatus === 'verified' && ['full_payment', 'balance'].includes(payType)) {
      rules.push({
        collective_id,
        taskPatterns: [
          'set internal deadline',
          '⚠ strict rule: internal deadline',
        ],
        reason: 'Full payment verified — deadline constraint met',
      });
    }
  }

  // ── DOCUMENT created / updated ─────────────────────────────────────────────
  if (entity === 'Document') {
    const collective_id = data.collective_id;
    if (!collective_id) return rules;

    const docType = data.document_type;
    const docStatus = data.status;

    // Passport uploaded
    if (docType === 'passport' && ['submitted', 'verified'].includes(docStatus)) {
      rules.push({
        collective_id,
        taskPatterns: ['collect passport copies/documents'],
        reason: 'Passport document submitted',
      });
    }

    // Visa document
    if (docType === 'visa' && ['submitted', 'verified'].includes(docStatus)) {
      rules.push({
        collective_id,
        taskPatterns: ['assist with visa requirements'],
        reason: 'Visa document submitted',
      });
    }

    // Vouchers
    if (docType === 'voucher' && ['submitted', 'verified'].includes(docStatus)) {
      rules.push({
        collective_id,
        taskPatterns: ['send travel vouchers to clients'],
        reason: 'Travel voucher uploaded',
      });
    }

    // Itinerary
    if (docType === 'itinerary' && ['submitted', 'verified'].includes(docStatus)) {
      rules.push({
        collective_id,
        taskPatterns: ['request final itinerary'],
        reason: 'Itinerary uploaded',
      });
    }

    // Booking confirmation
    if (docType === 'booking_confirmation' && ['submitted', 'verified'].includes(docStatus)) {
      rules.push({
        collective_id,
        taskPatterns: ['secure booking confirmation', 'reconfirm booking with operator'],
        reason: 'Booking confirmation document uploaded',
      });
    }

    // Any doc submitted = reminder sent (marking as handled)
    if (['submitted', 'verified'].includes(docStatus)) {
      rules.push({
        collective_id,
        taskPatterns: ['send reminders for lacking requirements', 'send travel reminders and confirmations'],
        reason: 'Document submitted — requirements handled',
      });
    }

    // Emergency contacts
    if (docType === 'other' && data.file_name?.toLowerCase().includes('emergency')) {
      rules.push({
        collective_id,
        taskPatterns: ['request emergency contact details'],
        reason: 'Emergency contact document uploaded',
      });
    }
  }

  // ── SURVEY created ─────────────────────────────────────────────────────────
  if (entity === 'Survey') {
    const collective_id = data.collective_id;
    if (!collective_id) return rules;

    rules.push({
      collective_id,
      taskPatterns: [
        'send post-trip evaluation form/survey',
        'survey: hotel experience',
        'survey: tour quality',
        'survey: flight experience',
        'survey: tour guide service',
        'survey: transfers and transportation',
        'survey: optional tours',
        'survey: overall satisfaction',
        'survey: suggestions and improvements',
        'record number of pax sold',
      ],
      reason: 'Survey/feedback submitted',
    });

    if (data.overall_rating) {
      rules.push({
        collective_id,
        taskPatterns: ['conduct profitability review', 'document recommendations for future selling'],
        reason: 'Survey with overall rating submitted',
      });
    }
  }

  return rules;
}

// ── MAIN HANDLER ─────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    // This function is called by automations and service-role invocations — no user auth required.
    const body = await req.json();

    // Support both direct calls and entity automation payloads
    const entityName = body.entity_name || body.event?.entity_name;
    const entityData = body.data || {};
    const oldData = body.old_data || {};
    const eventType = body.event_type || body.event?.type || 'update';

    if (!entityName || !entityData) {
      return Response.json({ error: 'entity_name and data are required' }, { status: 400 });
    }

    const rules = getCompletionRules(entityName, entityData, oldData);

    if (rules.length === 0) {
      return Response.json({ message: 'No completion rules matched', entity: entityName });
    }

    // Group rules by collective_id
    const byCollective = {};
    for (const rule of rules) {
      if (!rule.collective_id) continue;
      if (!byCollective[rule.collective_id]) byCollective[rule.collective_id] = [];
      byCollective[rule.collective_id].push(rule);
    }

    const results = [];

    for (const [collective_id, collectiveRules] of Object.entries(byCollective)) {
      // Fetch all checklist tasks for this collective
      const tasks = await base44.asServiceRole.entities.ChecklistTask.filter({ collective_id });
      if (tasks.length === 0) continue;

      // Build a flat list of patterns to match
      const allPatterns = collectiveRules.flatMap(r => r.taskPatterns);
      const uniquePatterns = [...new Set(allPatterns)];

      let completedCount = 0;
      const completedTaskNames = [];

      for (const task of tasks) {
        if (task.status === 'completed') continue; // already done

        const taskNameLower = task.task_name.toLowerCase();
        const matched = uniquePatterns.some(pattern => taskNameLower.includes(pattern.toLowerCase()));

        if (matched) {
          await base44.asServiceRole.entities.ChecklistTask.update(task.id, {
            status: 'completed',
            completed_at: new Date().toISOString(),
            notes: (task.notes ? task.notes + ' | ' : '') + `Auto-completed: ${entityName} action detected`,
          });
          completedCount++;
          completedTaskNames.push(task.task_name);
        }
      }

      if (completedCount > 0) {
        // Trigger progress recalculation
        await base44.asServiceRole.functions.invoke('updateWorkflowProgress', { collective_id });
        results.push({ collective_id, completed: completedCount, tasks: completedTaskNames });
      }
    }

    return Response.json({
      success: true,
      entity: entityName,
      event: eventType,
      synced_collectives: results.length,
      results,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});