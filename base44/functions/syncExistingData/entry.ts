import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * BACKFILL SYNC — Re-evaluates all existing data for a collective
 * and auto-completes checklist items based on what already exists.
 * Called manually from the Workflow UI to sync historical data.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { collective_id } = body;
    if (!collective_id) return Response.json({ error: 'collective_id required' }, { status: 400 });

    const invokeSync = (entity_name, data) =>
      base44.asServiceRole.functions.invoke('smartWorkflowSync', { entity_name, data, event_type: 'update' });

    // Fetch all related data in parallel
    const [collective, assets, bookings, payments, documents, surveys] = await Promise.all([
      base44.asServiceRole.entities.Collective.list().then(all => all.find(c => c.id === collective_id) || null),
      base44.asServiceRole.entities.MarketingAsset.filter({ collective_id }),
      base44.asServiceRole.entities.Booking.filter({ collective_id }),
      base44.asServiceRole.entities.Payment.filter({ collective_id }),
      base44.asServiceRole.entities.Document.filter({ collective_id }),
      base44.asServiceRole.entities.Survey.filter({ collective_id }),
    ]);

    const syncJobs = [];

    // Sync collective data
    if (collective) syncJobs.push(invokeSync('Collective', collective));

    // Sync each asset
    for (const asset of assets) syncJobs.push(invokeSync('MarketingAsset', asset));

    // Sync each booking
    for (const booking of bookings) syncJobs.push(invokeSync('Booking', booking));

    // Sync each payment
    for (const payment of payments) syncJobs.push(invokeSync('Payment', payment));

    // Sync each document
    for (const doc of documents) syncJobs.push(invokeSync('Document', doc));

    // Sync each survey
    for (const survey of surveys) syncJobs.push(invokeSync('Survey', survey));

    await Promise.all(syncJobs);

    // Final progress recalculation
    await base44.asServiceRole.functions.invoke('updateWorkflowProgress', { collective_id });

    // Return updated stats
    const tasks = await base44.asServiceRole.entities.ChecklistTask.filter({ collective_id });
    const completed = tasks.filter(t => t.status === 'completed').length;
    const pct = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;

    return Response.json({
      success: true,
      collective_id,
      synced_entities: {
        collective: collective ? 1 : 0,
        marketing_assets: assets.length,
        bookings: bookings.length,
        payments: payments.length,
        documents: documents.length,
        surveys: surveys.length,
      },
      workflow_progress: {
        total_tasks: tasks.length,
        completed_tasks: completed,
        completion_pct: pct,
      },
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});