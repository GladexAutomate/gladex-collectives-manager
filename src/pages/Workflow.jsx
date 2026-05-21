import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { CheckSquare, Plus, Filter, ChevronRight, ChevronDown, Clock, AlertTriangle, CheckCircle, Circle, Loader2, X, Kanban, LayoutList, Calendar, TrendingUp, Users, Plane, BarChart2, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';

const PHASES = [
  { number: 1, name: 'GATHER', color: 'amber', stages: [
    { number: 1, name: 'Product Sourcing' }, { number: 2, name: 'Product Evaluation & Approval' },
    { number: 3, name: 'Product Creation' }, { number: 4, name: 'Internal Documentation' },
    { number: 5, name: 'Upload in Collectives Tracker' }, { number: 6, name: 'Marketing Endorsement' },
  ]},
  { number: 2, name: 'LAUNCHING', color: 'sky', stages: [
    { number: 7, name: 'Product Launch' }, { number: 8, name: 'Reservation & Slot Holding' },
  ]},
  { number: 3, name: 'SALES & BOOKING', color: 'emerald', stages: [
    { number: 9, name: 'Payment Coordination' }, { number: 10, name: 'Booking Confirmation' },
  ]},
  { number: 4, name: 'DOCUMENTATION', color: 'purple', stages: [{ number: 11, name: 'Documentation' }] },
  { number: 5, name: 'PRE-DEPARTURE & ONGOING', color: 'orange', stages: [
    { number: 12, name: 'Pre-Departure Coordination' }, { number: 13, name: 'During Travel' },
  ]},
  { number: 6, name: 'SALES INCOME', color: 'rose', stages: [{ number: 14, name: 'Post-Travel Evaluation' }] },
  { number: 7, name: 'CLIENT EVALUATION', color: 'teal', stages: [{ number: 15, name: 'Post-Trip Evaluation & Client Feedback' }] },
];

const DEFAULT_TASKS = [
  // PHASE 1 — GATHER
  // Stage 1 — Product Sourcing | Product Development Team
  { phase_number: 1, phase_name: 'GATHER', stage_number: 1, stage_name: 'Product Sourcing', task_name: 'Identify potential collectives from partner operators', department: 'product_development', priority: 'high', order_index: 1 },
  { phase_number: 1, phase_name: 'GATHER', stage_number: 1, stage_name: 'Product Sourcing', task_name: 'Check marketability and demand of destination', department: 'product_development', priority: 'high', order_index: 2 },
  { phase_number: 1, phase_name: 'GATHER', stage_number: 1, stage_name: 'Product Sourcing', task_name: 'Compare competitor pricing', department: 'product_development', priority: 'medium', order_index: 3 },
  { phase_number: 1, phase_name: 'GATHER', stage_number: 1, stage_name: 'Product Sourcing', task_name: 'Review operator reputation and reliability', department: 'product_development', priority: 'medium', order_index: 4 },
  { phase_number: 1, phase_name: 'GATHER', stage_number: 1, stage_name: 'Product Sourcing', task_name: 'Request complete package details from operator: Inclusions', department: 'product_development', priority: 'high', order_index: 5 },
  { phase_number: 1, phase_name: 'GATHER', stage_number: 1, stage_name: 'Product Sourcing', task_name: 'Request complete package details from operator: Exclusions', department: 'product_development', priority: 'high', order_index: 6 },
  { phase_number: 1, phase_name: 'GATHER', stage_number: 1, stage_name: 'Product Sourcing', task_name: 'Request complete package details from operator: Flight details', department: 'product_development', priority: 'high', order_index: 7 },
  { phase_number: 1, phase_name: 'GATHER', stage_number: 1, stage_name: 'Product Sourcing', task_name: 'Request complete package details from operator: Hotel details', department: 'product_development', priority: 'high', order_index: 8 },
  { phase_number: 1, phase_name: 'GATHER', stage_number: 1, stage_name: 'Product Sourcing', task_name: 'Request complete package details from operator: Terms & conditions', department: 'product_development', priority: 'medium', order_index: 9 },
  { phase_number: 1, phase_name: 'GATHER', stage_number: 1, stage_name: 'Product Sourcing', task_name: 'Request complete package details from operator: Payment deadlines', department: 'product_development', priority: 'high', order_index: 10 },
  { phase_number: 1, phase_name: 'GATHER', stage_number: 1, stage_name: 'Product Sourcing', task_name: 'Request complete package details from operator: Cancellation policy', department: 'product_development', priority: 'medium', order_index: 11 },
  { phase_number: 1, phase_name: 'GATHER', stage_number: 1, stage_name: 'Product Sourcing', task_name: 'Request complete package details from operator: Agent Commission', department: 'product_development', priority: 'high', order_index: 12 },
  { phase_number: 1, phase_name: 'GATHER', stage_number: 1, stage_name: 'Product Sourcing', task_name: 'Confirm commission structure', department: 'product_development', priority: 'high', order_index: 13 },
  { phase_number: 1, phase_name: 'GATHER', stage_number: 1, stage_name: 'Product Sourcing', task_name: 'Confirm guaranteed departure status', department: 'product_development', priority: 'medium', order_index: 14 },
  { phase_number: 1, phase_name: 'GATHER', stage_number: 1, stage_name: 'Product Sourcing', task_name: 'Confirm seat/blocking allocation availability', department: 'product_development', priority: 'high', order_index: 15 },
  // Stage 2 — Product Evaluation & Approval | Product Development + Management
  { phase_number: 1, phase_name: 'GATHER', stage_number: 2, stage_name: 'Product Evaluation & Approval', task_name: 'Evaluate profitability and commission margin', department: 'product_development', priority: 'high', requires_approval: true, order_index: 1 },
  { phase_number: 1, phase_name: 'GATHER', stage_number: 2, stage_name: 'Product Evaluation & Approval', task_name: 'Review selling price competitiveness', department: 'product_development', priority: 'high', order_index: 2 },
  { phase_number: 1, phase_name: 'GATHER', stage_number: 2, stage_name: 'Product Evaluation & Approval', task_name: 'Check risk exposure and operator credibility', department: 'management', priority: 'high', order_index: 3 },
  { phase_number: 1, phase_name: 'GATHER', stage_number: 2, stage_name: 'Product Evaluation & Approval', task_name: 'Review payment schedules and deadlines', department: 'management', priority: 'urgent', order_index: 4 },
  { phase_number: 1, phase_name: 'GATHER', stage_number: 2, stage_name: 'Product Evaluation & Approval', task_name: 'Approve product for selling', department: 'management', priority: 'urgent', requires_approval: true, order_index: 5 },
  // Stage 3 — Product Creation | Product Development Team
  { phase_number: 1, phase_name: 'GATHER', stage_number: 3, stage_name: 'Product Creation', task_name: 'Create internal EZquote', department: 'product_development', priority: 'high', order_index: 1 },
  { phase_number: 1, phase_name: 'GATHER', stage_number: 3, stage_name: 'Product Creation', task_name: 'Add mark-up/buffer', department: 'product_development', priority: 'high', order_index: 2 },
  { phase_number: 1, phase_name: 'GATHER', stage_number: 3, stage_name: 'Product Creation', task_name: 'Convert rates into peso if applicable', department: 'product_development', priority: 'high', order_index: 3 },
  { phase_number: 1, phase_name: 'GATHER', stage_number: 3, stage_name: 'Product Creation', task_name: 'Add buffer for currency exchange', department: 'product_development', priority: 'medium', order_index: 4 },
  { phase_number: 1, phase_name: 'GATHER', stage_number: 3, stage_name: 'Product Creation', task_name: 'Prepare internal costing', department: 'product_development', priority: 'high', order_index: 5 },
  { phase_number: 1, phase_name: 'GATHER', stage_number: 3, stage_name: 'Product Creation', task_name: 'Create optional tour list', department: 'product_development', priority: 'medium', order_index: 6 },
  { phase_number: 1, phase_name: 'GATHER', stage_number: 3, stage_name: 'Product Creation', task_name: 'Prepare terms and conditions', department: 'product_development', priority: 'medium', order_index: 7 },
  // Stage 4 — Internal Documentation | Admin
  { phase_number: 1, phase_name: 'GATHER', stage_number: 4, stage_name: 'Internal Documentation', task_name: 'Save operator tariff in Google Drive', department: 'admin', priority: 'high', order_index: 1 },
  { phase_number: 1, phase_name: 'GATHER', stage_number: 4, stage_name: 'Internal Documentation', task_name: 'Save operator contact details', department: 'admin', priority: 'medium', order_index: 2 },
  { phase_number: 1, phase_name: 'GATHER', stage_number: 4, stage_name: 'Internal Documentation', task_name: 'Save payment deadlines', department: 'admin', priority: 'high', order_index: 3 },
  { phase_number: 1, phase_name: 'GATHER', stage_number: 4, stage_name: 'Internal Documentation', task_name: 'Save operator posters and materials', department: 'admin', priority: 'medium', order_index: 4 },
  { phase_number: 1, phase_name: 'GATHER', stage_number: 4, stage_name: 'Internal Documentation', task_name: 'Update destination tracker', department: 'admin', priority: 'high', order_index: 5 },
  { phase_number: 1, phase_name: 'GATHER', stage_number: 4, stage_name: 'Internal Documentation', task_name: 'Update collective monitoring tracker', department: 'admin', priority: 'high', order_index: 6 },
  // Stage 5 — Upload in Collectives Tracker | Product Development Dept
  { phase_number: 1, phase_name: 'GATHER', stage_number: 5, stage_name: 'Upload in Collectives Tracker', task_name: 'Upload collective package in Google Drive', department: 'product_development', priority: 'high', order_index: 1 },
  { phase_number: 1, phase_name: 'GATHER', stage_number: 5, stage_name: 'Upload in Collectives Tracker', task_name: 'Encode departure dates', department: 'product_development', priority: 'high', order_index: 2 },
  { phase_number: 1, phase_name: 'GATHER', stage_number: 5, stage_name: 'Upload in Collectives Tracker', task_name: 'Encode pricing', department: 'product_development', priority: 'high', order_index: 3 },
  { phase_number: 1, phase_name: 'GATHER', stage_number: 5, stage_name: 'Upload in Collectives Tracker', task_name: 'Encode flight details', department: 'product_development', priority: 'high', order_index: 4 },
  { phase_number: 1, phase_name: 'GATHER', stage_number: 5, stage_name: 'Upload in Collectives Tracker', task_name: 'Encode available slots', department: 'product_development', priority: 'high', order_index: 5 },
  { phase_number: 1, phase_name: 'GATHER', stage_number: 5, stage_name: 'Upload in Collectives Tracker', task_name: 'Encode payment deadlines', department: 'product_development', priority: 'urgent', order_index: 6 },
  { phase_number: 1, phase_name: 'GATHER', stage_number: 5, stage_name: 'Upload in Collectives Tracker', task_name: 'Add remarks and booking conditions', department: 'product_development', priority: 'medium', order_index: 7 },
  // Stage 6 — Marketing Endorsement | Marketing Team
  { phase_number: 1, phase_name: 'GATHER', stage_number: 6, stage_name: 'Marketing Endorsement', task_name: 'Receive finalized package details', department: 'marketing', priority: 'high', order_index: 1 },
  { phase_number: 1, phase_name: 'GATHER', stage_number: 6, stage_name: 'Marketing Endorsement', task_name: 'Create official marketing poster if needed', department: 'marketing', priority: 'high', order_index: 2 },
  { phase_number: 1, phase_name: 'GATHER', stage_number: 6, stage_name: 'Marketing Endorsement', task_name: 'Prepare optional tour posters', department: 'marketing', priority: 'medium', order_index: 3 },
  { phase_number: 1, phase_name: 'GATHER', stage_number: 6, stage_name: 'Marketing Endorsement', task_name: 'Ensure itinerary visuals are accurate', department: 'marketing', priority: 'high', order_index: 4 },
  { phase_number: 1, phase_name: 'GATHER', stage_number: 6, stage_name: 'Marketing Endorsement', task_name: 'Prepare reels/videos aligned with itinerary only', department: 'marketing', priority: 'medium', order_index: 5 },
  { phase_number: 1, phase_name: 'GATHER', stage_number: 6, stage_name: 'Marketing Endorsement', task_name: 'Prepare social media captions', department: 'marketing', priority: 'medium', order_index: 6 },
  { phase_number: 1, phase_name: 'GATHER', stage_number: 6, stage_name: 'Marketing Endorsement', task_name: 'Prepare E-blast materials', department: 'marketing', priority: 'medium', order_index: 7 },
  // PHASE 2 — LAUNCHING
  // Stage 7 — Product Launch | Product Development + Marketing
  { phase_number: 2, phase_name: 'LAUNCHING', stage_number: 7, stage_name: 'Product Launch', task_name: 'Endorse package in Product Update GC', department: 'product_development', priority: 'high', order_index: 1 },
  { phase_number: 2, phase_name: 'LAUNCHING', stage_number: 7, stage_name: 'Product Launch', task_name: 'Obtain acknowledgment from Sales Team', department: 'marketing', priority: 'high', order_index: 2 },
  { phase_number: 2, phase_name: 'LAUNCHING', stage_number: 7, stage_name: 'Product Launch', task_name: 'Make a Product Update post', department: 'marketing', priority: 'high', order_index: 3 },
  { phase_number: 2, phase_name: 'LAUNCHING', stage_number: 7, stage_name: 'Product Launch', task_name: 'Upload/post to Facebook', department: 'marketing', priority: 'high', order_index: 4 },
  { phase_number: 2, phase_name: 'LAUNCHING', stage_number: 7, stage_name: 'Product Launch', task_name: 'Upload/post to Instagram', department: 'marketing', priority: 'high', order_index: 5 },
  { phase_number: 2, phase_name: 'LAUNCHING', stage_number: 7, stage_name: 'Product Launch', task_name: 'Upload/post to Website', department: 'marketing', priority: 'high', order_index: 6 },
  { phase_number: 2, phase_name: 'LAUNCHING', stage_number: 7, stage_name: 'Product Launch', task_name: 'Upload/post to Sub-agent groups (POTB)', department: 'marketing', priority: 'medium', order_index: 7 },
  { phase_number: 2, phase_name: 'LAUNCHING', stage_number: 7, stage_name: 'Product Launch', task_name: 'Release promotional materials', department: 'marketing', priority: 'medium', order_index: 8 },
  // Stage 8 — Reservation & Slot Holding | Sales Team / Admin
  { phase_number: 2, phase_name: 'LAUNCHING', stage_number: 8, stage_name: 'Reservation & Slot Holding', task_name: 'Receive booking inquiry', department: 'sales', priority: 'high', order_index: 1 },
  { phase_number: 2, phase_name: 'LAUNCHING', stage_number: 8, stage_name: 'Reservation & Slot Holding', task_name: 'Coordinate with operator for slot availability', department: 'sales', priority: 'high', order_index: 2 },
  { phase_number: 2, phase_name: 'LAUNCHING', stage_number: 8, stage_name: 'Reservation & Slot Holding', task_name: 'Hold reservation if allowed by operator', department: 'admin', priority: 'high', order_index: 3 },
  { phase_number: 2, phase_name: 'LAUNCHING', stage_number: 8, stage_name: 'Reservation & Slot Holding', task_name: 'Check payment deadline', department: 'admin', priority: 'urgent', order_index: 4 },
  { phase_number: 2, phase_name: 'LAUNCHING', stage_number: 8, stage_name: 'Reservation & Slot Holding', task_name: 'Inform client of payment terms', department: 'sales', priority: 'high', order_index: 5 },
  // PHASE 3 — SALES
  // Stage 9 — Payment Coordination | Sales + Accounting
  { phase_number: 3, phase_name: 'SALES & BOOKING', stage_number: 9, stage_name: 'Payment Coordination', task_name: 'Collect downpayment/full payment from client', department: 'accounting', priority: 'urgent', order_index: 1 },
  { phase_number: 3, phase_name: 'SALES & BOOKING', stage_number: 9, stage_name: 'Payment Coordination', task_name: 'Coordinate payment deadline with Accounting', department: 'sales', priority: 'urgent', order_index: 2 },
  { phase_number: 3, phase_name: 'SALES & BOOKING', stage_number: 9, stage_name: 'Payment Coordination', task_name: 'Ensure payment is processed BEFORE operator deadline', department: 'accounting', priority: 'urgent', order_index: 3 },
  { phase_number: 3, phase_name: 'SALES & BOOKING', stage_number: 9, stage_name: 'Payment Coordination', task_name: '⚠ STRICT RULE: Internal deadline must be earlier than supplier deadline (buffer period)', department: 'management', priority: 'urgent', order_index: 4 },
  { phase_number: 3, phase_name: 'SALES & BOOKING', stage_number: 9, stage_name: 'Payment Coordination', task_name: 'Set internal deadline at least 15-30 days before supplier deadline', department: 'admin', priority: 'urgent', order_index: 5 },
  // Stage 10 — Booking Confirmation | Admin
  { phase_number: 3, phase_name: 'SALES & BOOKING', stage_number: 10, stage_name: 'Booking Confirmation', task_name: 'Send passenger details to operator', department: 'admin', priority: 'urgent', order_index: 1 },
  { phase_number: 3, phase_name: 'SALES & BOOKING', stage_number: 10, stage_name: 'Booking Confirmation', task_name: 'Secure booking confirmation', department: 'admin', priority: 'urgent', order_index: 2 },
  { phase_number: 3, phase_name: 'SALES & BOOKING', stage_number: 10, stage_name: 'Booking Confirmation', task_name: 'Request booking reference', department: 'admin', priority: 'high', order_index: 3 },
  { phase_number: 3, phase_name: 'SALES & BOOKING', stage_number: 10, stage_name: 'Booking Confirmation', task_name: 'Update slot inventory tracker', department: 'admin', priority: 'high', order_index: 4 },
  // PHASE 4 — DOCUMENTATION
  // Stage 11 — Documentation | Admin Team / Visa
  { phase_number: 4, phase_name: 'DOCUMENTATION', stage_number: 11, stage_name: 'Documentation', task_name: 'Collect passport copies/documents', department: 'visa', priority: 'urgent', order_index: 1 },
  { phase_number: 4, phase_name: 'DOCUMENTATION', stage_number: 11, stage_name: 'Documentation', task_name: 'Assist visa requirements if applicable', department: 'visa', priority: 'urgent', order_index: 2 },
  { phase_number: 4, phase_name: 'DOCUMENTATION', stage_number: 11, stage_name: 'Documentation', task_name: 'Send reminders for lacking requirements (if there is visa needed)', department: 'visa', priority: 'urgent', order_index: 3 },
  { phase_number: 4, phase_name: 'DOCUMENTATION', stage_number: 11, stage_name: 'Documentation', task_name: 'Send travel reminders and confirmations', department: 'admin', priority: 'high', order_index: 4 },
  // PHASE 5 — PRE-DEPARTURE & ONGOING TRAVEL
  // Stage 12 — Pre-Departure Coordination | Admin / Operations
  { phase_number: 5, phase_name: 'PRE-DEPARTURE & ONGOING TRAVEL', stage_number: 12, stage_name: 'Pre-Departure Coordination', task_name: 'Reconfirm booking with operator', department: 'operations', priority: 'urgent', order_index: 1 },
  { phase_number: 5, phase_name: 'PRE-DEPARTURE & ONGOING TRAVEL', stage_number: 12, stage_name: 'Pre-Departure Coordination', task_name: 'Request final itinerary', department: 'operations', priority: 'high', order_index: 2 },
  { phase_number: 5, phase_name: 'PRE-DEPARTURE & ONGOING TRAVEL', stage_number: 12, stage_name: 'Pre-Departure Coordination', task_name: 'Request emergency contact details', department: 'admin', priority: 'high', order_index: 3 },
  { phase_number: 5, phase_name: 'PRE-DEPARTURE & ONGOING TRAVEL', stage_number: 12, stage_name: 'Pre-Departure Coordination', task_name: 'Send travel vouchers to clients', department: 'admin', priority: 'high', order_index: 4 },
  { phase_number: 5, phase_name: 'PRE-DEPARTURE & ONGOING TRAVEL', stage_number: 12, stage_name: 'Pre-Departure Coordination', task_name: 'Coordinate special requests if any', department: 'operations', priority: 'medium', order_index: 5 },
  // Stage 13 — During Travel | Operations / Sales Support
  { phase_number: 5, phase_name: 'PRE-DEPARTURE & ONGOING TRAVEL', stage_number: 13, stage_name: 'During Travel', task_name: 'Monitor trip status', department: 'operations', priority: 'urgent', order_index: 1 },
  { phase_number: 5, phase_name: 'PRE-DEPARTURE & ONGOING TRAVEL', stage_number: 13, stage_name: 'During Travel', task_name: 'Coordinate with operator during emergencies/disruptions', department: 'operations', priority: 'urgent', order_index: 2 },
  { phase_number: 5, phase_name: 'PRE-DEPARTURE & ONGOING TRAVEL', stage_number: 13, stage_name: 'During Travel', task_name: 'Monitor client satisfaction during trip', department: 'sales', priority: 'high', order_index: 3 },
  // PHASE 6 — SALES INCOME
  // Stage 14 — Post-Travel Evaluation | Sales Manager
  { phase_number: 6, phase_name: 'SALES INCOME', stage_number: 14, stage_name: 'Post-Travel Evaluation', task_name: 'Record number of pax sold', department: 'sales', priority: 'high', order_index: 1 },
  { phase_number: 6, phase_name: 'SALES INCOME', stage_number: 14, stage_name: 'Post-Travel Evaluation', task_name: 'Record total revenue generated', department: 'accounting', priority: 'high', order_index: 2 },
  { phase_number: 6, phase_name: 'SALES INCOME', stage_number: 14, stage_name: 'Post-Travel Evaluation', task_name: 'Record total commission earned', department: 'accounting', priority: 'high', order_index: 3 },
  { phase_number: 6, phase_name: 'SALES INCOME', stage_number: 14, stage_name: 'Post-Travel Evaluation', task_name: 'Conduct profitability review', department: 'management', priority: 'high', requires_approval: true, order_index: 4 },
  { phase_number: 6, phase_name: 'SALES INCOME', stage_number: 14, stage_name: 'Post-Travel Evaluation', task_name: 'Document recommendation for future selling', department: 'management', priority: 'medium', order_index: 5 },
  // PHASE 7 — CLIENT EVALUATION
  // Stage 15 — Post-Trip Evaluation & Client Feedback | Admin / Sales Agent
  { phase_number: 7, phase_name: 'CLIENT EVALUATION', stage_number: 15, stage_name: 'Post-Trip Evaluation & Client Feedback', task_name: 'Send post-trip evaluation form/survey to clients within 3–5 days after travel', department: 'sales', priority: 'high', order_index: 1 },
  { phase_number: 7, phase_name: 'CLIENT EVALUATION', stage_number: 15, stage_name: 'Post-Trip Evaluation & Client Feedback', task_name: 'Survey covers: Hotel Experience', department: 'admin', priority: 'medium', order_index: 2 },
  { phase_number: 7, phase_name: 'CLIENT EVALUATION', stage_number: 15, stage_name: 'Post-Trip Evaluation & Client Feedback', task_name: 'Survey covers: Tour quality', department: 'admin', priority: 'medium', order_index: 3 },
  { phase_number: 7, phase_name: 'CLIENT EVALUATION', stage_number: 15, stage_name: 'Post-Trip Evaluation & Client Feedback', task_name: 'Survey covers: Flight Experience', department: 'admin', priority: 'medium', order_index: 4 },
  { phase_number: 7, phase_name: 'CLIENT EVALUATION', stage_number: 15, stage_name: 'Post-Trip Evaluation & Client Feedback', task_name: 'Survey covers: Tour guide service', department: 'admin', priority: 'medium', order_index: 5 },
  { phase_number: 7, phase_name: 'CLIENT EVALUATION', stage_number: 15, stage_name: 'Post-Trip Evaluation & Client Feedback', task_name: 'Survey covers: Transfers and transportation', department: 'admin', priority: 'medium', order_index: 6 },
  { phase_number: 7, phase_name: 'CLIENT EVALUATION', stage_number: 15, stage_name: 'Post-Trip Evaluation & Client Feedback', task_name: 'Survey covers: Optional tours', department: 'admin', priority: 'medium', order_index: 7 },
  { phase_number: 7, phase_name: 'CLIENT EVALUATION', stage_number: 15, stage_name: 'Post-Trip Evaluation & Client Feedback', task_name: 'Survey covers: Overall satisfaction', department: 'admin', priority: 'high', order_index: 8 },
  { phase_number: 7, phase_name: 'CLIENT EVALUATION', stage_number: 15, stage_name: 'Post-Trip Evaluation & Client Feedback', task_name: 'Survey covers: Suggestions and Improvements', department: 'admin', priority: 'medium', order_index: 9 },
];

const STAGE_DEPARTMENTS = {
  1: ['product_development'], 2: ['product_development', 'management'], 3: ['product_development'],
  4: ['admin'], 5: ['product_development'], 6: ['marketing'], 7: ['product_development', 'marketing'],
  8: ['sales', 'admin'], 9: ['sales', 'accounting'], 10: ['admin'], 11: ['admin', 'visa'],
  12: ['admin', 'operations'], 13: ['operations', 'sales'], 14: ['sales'], 15: ['admin'],
};

const DEPT_LABELS = { product_development: 'Product Dev', marketing: 'Marketing', sales: 'Sales', accounting: 'Accounting', admin: 'Admin', operations: 'Operations', visa: 'Visa', management: 'Management' };
const DEPT_COLORS = { product_development: 'bg-amber-100 text-amber-700', marketing: 'bg-pink-100 text-pink-700', sales: 'bg-emerald-100 text-emerald-700', accounting: 'bg-purple-100 text-purple-700', admin: 'bg-sky-100 text-sky-700', operations: 'bg-orange-100 text-orange-700', visa: 'bg-rose-100 text-rose-700', management: 'bg-slate-100 text-slate-700' };
const priorityConfig = { low: 'bg-slate-100 text-slate-600', medium: 'bg-sky-100 text-sky-700', high: 'bg-amber-100 text-amber-700', urgent: 'bg-rose-100 text-rose-700' };
const taskStatusConfig = { pending: { icon: Circle, label: 'Pending', class: 'text-slate-500' }, in_progress: { icon: Loader2, label: 'In Progress', class: 'text-sky-500' }, completed: { icon: CheckCircle, label: 'Done', class: 'text-emerald-500' }, delayed: { icon: AlertTriangle, label: 'Delayed', class: 'text-rose-500' }, cancelled: { icon: X, label: 'Cancelled', class: 'text-slate-400' } };
const phaseColorMap = {
  1: { bg: 'bg-amber-500', text: 'text-amber-600', light: 'bg-amber-50 dark:bg-amber-950/20', border: 'border-amber-200 dark:border-amber-800' },
  2: { bg: 'bg-sky-500', text: 'text-sky-600', light: 'bg-sky-50 dark:bg-sky-950/20', border: 'border-sky-200 dark:border-sky-800' },
  3: { bg: 'bg-emerald-500', text: 'text-emerald-600', light: 'bg-emerald-50 dark:bg-emerald-950/20', border: 'border-emerald-200 dark:border-emerald-800' },
  4: { bg: 'bg-purple-500', text: 'text-purple-600', light: 'bg-purple-50 dark:bg-purple-950/20', border: 'border-purple-200 dark:border-purple-800' },
  5: { bg: 'bg-orange-500', text: 'text-orange-600', light: 'bg-orange-50 dark:bg-orange-950/20', border: 'border-orange-200 dark:border-orange-800' },
  6: { bg: 'bg-rose-500', text: 'text-rose-600', light: 'bg-rose-50 dark:bg-rose-950/20', border: 'border-rose-200 dark:border-rose-800' },
  7: { bg: 'bg-teal-500', text: 'text-teal-600', light: 'bg-teal-50 dark:bg-teal-950/20', border: 'border-teal-200 dark:border-teal-800' },
};

const LIFECYCLE_STAGES = ['draft', 'for_approval', 'product_development', 'marketing_prep', 'open_booking', 'reservation_ongoing', 'payment_verification', 'documentation', 'pre_departure', 'ongoing', 'completed'];
const LIFECYCLE_LABELS = { draft: 'Draft', for_approval: 'For Approval', product_development: 'Product Dev', marketing_prep: 'Marketing Prep', open_booking: 'Open Booking', reservation_ongoing: 'Reservation Ongoing', payment_verification: 'Payment Verification', documentation: 'Documentation', pre_departure: 'Pre-Departure', ongoing: 'Ongoing Travel', completed: 'Completed' };
const LIFECYCLE_COLORS = { draft: 'bg-slate-100 text-slate-600', for_approval: 'bg-purple-100 text-purple-700', product_development: 'bg-amber-100 text-amber-700', marketing_prep: 'bg-pink-100 text-pink-700', open_booking: 'bg-teal-100 text-teal-700', reservation_ongoing: 'bg-blue-100 text-blue-700', payment_verification: 'bg-orange-100 text-orange-700', documentation: 'bg-indigo-100 text-indigo-700', pre_departure: 'bg-violet-100 text-violet-700', ongoing: 'bg-amber-100 text-amber-700', completed: 'bg-emerald-100 text-emerald-700' };

export default function Workflow() {
  const [collectives, setCollectives] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [selectedCollective, setSelectedCollective] = useState('');
  const [expandedPhases, setExpandedPhases] = useState({ 1: true });
  const [statusFilter, setStatusFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [taskForm, setTaskForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'checklist'
  const [updatingStage, setUpdatingStage] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    base44.entities.Collective.list().then(setCollectives);
    const params = new URLSearchParams(window.location.search);
    const cid = params.get('collective');
    if (cid) { setSelectedCollective(cid); setViewMode('checklist'); }
  }, []);

  useEffect(() => {
    if (selectedCollective) {
      base44.entities.ChecklistTask.filter({ collective_id: selectedCollective }).then(setTasks);
    } else {
      base44.entities.ChecklistTask.list('-created_date', 200).then(setTasks);
    }
  }, [selectedCollective]);

  const initializeTasks = async () => {
    if (!selectedCollective) return;
    setInitializing(true);
    const tasksToCreate = DEFAULT_TASKS.map((t, i) => ({
      ...t,
      collective_id: selectedCollective,
      status: 'pending',
      order_index: i,
      department: (STAGE_DEPARTMENTS[t.stage_number] || [])[0] || 'admin',
    }));
    await base44.entities.ChecklistTask.bulkCreate(tasksToCreate);
    const updated = await base44.entities.ChecklistTask.filter({ collective_id: selectedCollective });
    setTasks(updated);
    setInitializing(false);
  };

  const updateTaskStatus = async (task, newStatus) => {
    const now = new Date().toISOString();
    await base44.entities.ChecklistTask.update(task.id, {
      status: newStatus,
      completed_at: newStatus === 'completed' ? now : null,
    });

    const updatedTasks = tasks.map(t => t.id === task.id ? { ...t, status: newStatus, completed_at: newStatus === 'completed' ? now : null } : t);
    setTasks(updatedTasks);

    // AUTO-COMPLETION CASCADE: Stage → Phase → Collective
    if (newStatus === 'completed' && selectedCollective) {
      // Check if all tasks in this stage are now completed
      const stageTasks = updatedTasks.filter(t => t.stage_number === task.stage_number && t.collective_id === selectedCollective);
      const stageComplete = stageTasks.length > 0 && stageTasks.every(t => t.status === 'completed');

      if (stageComplete) {
        // Check if all stages in this phase are completed
        const phase = PHASES.find(p => p.number === task.phase_number);
        if (phase) {
          const allPhaseStageNums = phase.stages.map(s => s.number);
          const allPhaseTasks = updatedTasks.filter(t => allPhaseStageNums.includes(t.stage_number) && t.collective_id === selectedCollective);
          const phaseComplete = allPhaseTasks.length > 0 && allPhaseTasks.every(t => t.status === 'completed');

          // Auto-update collective phase/stage progress
          const currentCollective = collectives.find(c => c.id === selectedCollective);
          if (currentCollective) {
            const nextStageInPhase = phase.stages.find(s => s.number > task.stage_number);
            const nextPhase = PHASES.find(p => p.number === task.phase_number + 1);

            if (phaseComplete && nextPhase) {
              // Advance to next phase
              await base44.entities.Collective.update(selectedCollective, {
                current_phase: nextPhase.number,
                current_stage: nextPhase.stages[0]?.number || task.stage_number + 1,
              });
              setCollectives(prev => prev.map(c => c.id === selectedCollective ? { ...c, current_phase: nextPhase.number } : c));
            } else if (!phaseComplete && nextStageInPhase) {
              // Advance to next stage in current phase
              await base44.entities.Collective.update(selectedCollective, { current_stage: nextStageInPhase.number });
            } else if (phaseComplete && !nextPhase) {
              // All phases complete — mark collective as completed
              await base44.entities.Collective.update(selectedCollective, { status: 'completed' });
              setCollectives(prev => prev.map(c => c.id === selectedCollective ? { ...c, status: 'completed' } : c));
            }
          }
        }
      }
    }
  };

  const openEditTask = (task) => { setEditingTask(task); setTaskForm({ ...task }); setShowTaskModal(true); };

  const openNewTask = (phaseNumber, stageNumber, stageName) => {
    setEditingTask(null);
    setTaskForm({
      collective_id: selectedCollective,
      phase_number: phaseNumber,
      phase_name: PHASES.find(p => p.number === phaseNumber)?.name,
      stage_number: stageNumber,
      stage_name: stageName,
      department: (STAGE_DEPARTMENTS[stageNumber] || [])[0] || '',
      status: 'pending',
      priority: 'medium',
    });
    setShowTaskModal(true);
  };

  const saveTask = async () => {
    setSaving(true);
    if (editingTask) {
      await base44.entities.ChecklistTask.update(editingTask.id, taskForm);
    } else {
      await base44.entities.ChecklistTask.create(taskForm);
    }
    const updated = selectedCollective
      ? await base44.entities.ChecklistTask.filter({ collective_id: selectedCollective })
      : await base44.entities.ChecklistTask.list('-created_date', 200);
    setTasks(updated);
    setSaving(false);
    setShowTaskModal(false);
  };

  const moveCollectiveStage = async (collective, newStatus) => {
    setUpdatingStage(collective.id);
    await base44.entities.Collective.update(collective.id, { status: newStatus });
    setCollectives(prev => prev.map(c => c.id === collective.id ? { ...c, status: newStatus } : c));
    setUpdatingStage(null);
  };

  const filteredTasks = tasks.filter(t => {
    const matchStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchDept = deptFilter === 'all' || t.department === deptFilter;
    return matchStatus && matchDept;
  });

  const getTasksForStage = (stageNumber) => filteredTasks.filter(t => t.stage_number === stageNumber);
  const getPhaseProgress = (phaseNumber) => {
    const phaseTasks = tasks.filter(t => t.phase_number === phaseNumber);
    if (!phaseTasks.length) return 0;
    return Math.round((phaseTasks.filter(t => t.status === 'completed').length / phaseTasks.length) * 100);
  };
  const totalCompleted = tasks.filter(t => t.status === 'completed').length;
  const totalProgress = tasks.length > 0 ? Math.round((totalCompleted / tasks.length) * 100) : 0;
  const togglePhase = (n) => setExpandedPhases(prev => ({ ...prev, [n]: !prev[n] }));

  // Kanban: group collectives by lifecycle stage
  const kanbanCols = LIFECYCLE_STAGES.map(stage => ({
    stage,
    label: LIFECYCLE_LABELS[stage],
    color: LIFECYCLE_COLORS[stage],
    items: collectives.filter(c => (c.status || 'draft') === stage),
  })).filter(col => col.items.length > 0 || ['draft', 'product_development', 'open_booking', 'ongoing', 'completed'].includes(col.stage));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-jakarta text-foreground">Workflow Engine</h2>
          <p className="text-sm text-muted-foreground">Destination Lifecycle · 7 Phases · 15 Stages</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" variant={viewMode === 'kanban' ? 'default' : 'outline'} className={cn("gap-1.5 h-8 text-xs", viewMode === 'kanban' && "gradient-gold text-white border-0")} onClick={() => setViewMode('kanban')}>
            <Kanban className="w-3.5 h-3.5" /> Destination Board
          </Button>
          <Button size="sm" variant={viewMode === 'checklist' ? 'default' : 'outline'} className={cn("gap-1.5 h-8 text-xs", viewMode === 'checklist' && "gradient-gold text-white border-0")} onClick={() => setViewMode('checklist')}>
            <CheckSquare className="w-3.5 h-3.5" /> Checklist View
          </Button>
        </div>
      </div>

      {/* ====== KANBAN / DESTINATION LIFECYCLE VIEW ====== */}
      {viewMode === 'kanban' && (
        <div className="space-y-4">
          <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold font-jakarta text-primary">{collectives.length}</p>
                <p className="text-xs text-muted-foreground">Total Collectives</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold font-jakarta text-emerald-600">{collectives.filter(c => ['open_booking','reservation_ongoing'].includes(c.status)).length}</p>
                <p className="text-xs text-muted-foreground">Booking Open</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold font-jakarta text-amber-600">{collectives.filter(c => c.status === 'ongoing').length}</p>
                <p className="text-xs text-muted-foreground">Ongoing Travel</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold font-jakarta text-purple-600">{collectives.filter(c => c.status === 'completed').length}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </div>
          </div>

          {/* Kanban Board */}
          <div className="flex gap-4 overflow-x-auto pb-4">
            {kanbanCols.map(col => (
              <div key={col.stage} className="flex-shrink-0 w-72">
                <div className={cn("flex items-center justify-between px-3 py-2 rounded-t-lg mb-2", col.color)}>
                  <span className="text-xs font-semibold">{col.label}</span>
                  <span className="text-xs font-bold">{col.items.length}</span>
                </div>
                <div className="space-y-2 min-h-[80px]">
                  {col.items.map(c => {
                    const pct = c.total_slots > 0 ? Math.round(((c.booked_pax || 0) / c.total_slots) * 100) : 0;
                    const sellingPrice = c.selling_price || c.base_price;
                    const nextStageIdx = LIFECYCLE_STAGES.indexOf(col.stage);
                    const nextStage = LIFECYCLE_STAGES[nextStageIdx + 1];
                    return (
                      <div key={c.id} className="bg-card border border-border rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="text-xs font-semibold text-foreground font-jakarta line-clamp-2">{c.name}</p>
                            <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Plane className="w-2.5 h-2.5" /> {c.destination}
                            </p>
                          </div>
                          <button onClick={() => { setSelectedCollective(c.id); setViewMode('checklist'); }} className="text-muted-foreground hover:text-primary ml-2 flex-shrink-0">
                            <CheckSquare className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-2">
                          <span className="flex items-center gap-1"><Users className="w-2.5 h-2.5" />{c.booked_pax || 0}/{c.total_slots || 0}</span>
                          {sellingPrice > 0 && <span className="font-medium text-emerald-600">₱{Number(sellingPrice).toLocaleString()}</span>}
                        </div>
                        {c.total_slots > 0 && (
                          <div className="h-1 bg-muted rounded-full mb-2">
                            <div className={cn("h-full rounded-full", pct >= 90 ? "bg-rose-500" : pct >= 70 ? "bg-amber-500" : "bg-emerald-500")} style={{ width: `${Math.min(100, pct)}%` }} />
                          </div>
                        )}
                        {nextStage && (
                          <button
                            disabled={updatingStage === c.id}
                            onClick={() => moveCollectiveStage(c, nextStage)}
                            className="w-full text-[10px] text-center text-primary hover:underline flex items-center justify-center gap-1 mt-1"
                          >
                            {updatingStage === c.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <ChevronRight className="w-3 h-3" />}
                            Move to {LIFECYCLE_LABELS[nextStage]}
                          </button>
                        )}
                      </div>
                    );
                  })}
                  {col.items.length === 0 && (
                    <div className="border-2 border-dashed border-border rounded-xl p-4 text-center">
                      <p className="text-[10px] text-muted-foreground">No collectives</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ====== CHECKLIST VIEW ====== */}
      {viewMode === 'checklist' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <Select value={selectedCollective || ''} onValueChange={v => setSelectedCollective(v)}>
              <SelectTrigger className="w-56"><SelectValue placeholder="All Collectives" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>All Collectives</SelectItem>
                {collectives.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {Object.entries(taskStatusConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={deptFilter} onValueChange={setDeptFilter}>
              <SelectTrigger className="w-44"><SelectValue placeholder="Department" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {Object.entries(DEPT_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="flex gap-2 ml-auto">
              {selectedCollective && tasks.length === 0 && (
                <Button onClick={initializeTasks} disabled={initializing} variant="outline" className="gap-2 h-9 text-xs">
                  {initializing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckSquare className="w-4 h-4" />} Initialize Tasks
                </Button>
              )}
              <Button onClick={() => { setEditingTask(null); setTaskForm({ collective_id: selectedCollective, status: 'pending', priority: 'medium' }); setShowTaskModal(true); }} className="gradient-gold text-white border-0 gap-2 h-9 text-xs">
                <Plus className="w-4 h-4" /> Add Task
              </Button>
            </div>
          </div>

          {/* Overall Progress */}
          <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold font-jakarta text-foreground">Checklist Progress</h3>
                <p className="text-xs text-muted-foreground">{totalCompleted} of {tasks.length} tasks completed</p>
              </div>
              <span className="text-2xl font-bold font-jakarta text-primary">{totalProgress}%</span>
            </div>
            <Progress value={totalProgress} className="h-2" />
            <div className="flex gap-4 mt-3 flex-wrap">
              {Object.entries(taskStatusConfig).map(([key, cfg]) => {
                const count = tasks.filter(t => t.status === key).length;
                return (
                  <div key={key} className="flex items-center gap-1.5 text-xs">
                    <cfg.icon className={cn("w-3 h-3", cfg.class)} />
                    <span className="text-muted-foreground">{cfg.label}: <span className="font-medium text-foreground">{count}</span></span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Phase Accordion */}
          <div className="space-y-3">
            {PHASES.map(phase => {
              const colors = phaseColorMap[phase.number];
              const progress = getPhaseProgress(phase.number);
              const expanded = expandedPhases[phase.number];
              const phaseTaskCount = tasks.filter(t => t.phase_number === phase.number).length;
              return (
                <div key={phase.number} className={cn("rounded-xl border overflow-hidden shadow-sm", colors.border)}>
                  <button onClick={() => togglePhase(phase.number)} className={cn("w-full flex items-center justify-between p-4 text-left", colors.light)}>
                    <div className="flex items-center gap-3">
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold", colors.bg)}>{phase.number}</div>
                      <div>
                        <p className={cn("font-semibold font-jakarta text-sm", colors.text)}>Phase {phase.number}: {phase.name}</p>
                        <p className="text-xs text-muted-foreground">{phaseTaskCount} tasks · {progress}% complete</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="hidden sm:block w-24"><Progress value={progress} className="h-1.5" /></div>
                      <span className={cn("text-xs font-semibold", colors.text)}>{progress}%</span>
                      {expanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  </button>
                  {expanded && (
                    <div className="divide-y divide-border bg-card">
                      {phase.stages.map(stage => {
                        const stageTasks = getTasksForStage(stage.number);
                        return (
                          <div key={stage.number} className="p-4">
                            {/* Stage Header — matches reference image dark row style */}
                        <div className="flex items-center justify-between bg-slate-800 dark:bg-slate-900 text-white px-3 py-2.5 -mx-4 mb-0">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <span className="text-xs font-bold text-white whitespace-nowrap">STAGE {stage.number} — {stage.name.toUpperCase()}</span>
                            <span className="text-slate-400 text-[10px]">|</span>
                            <div className="flex items-center gap-1 flex-wrap">
                              {(STAGE_DEPARTMENTS[stage.number] || []).map(d => (
                                <span key={d} className="text-[10px] text-slate-300 font-medium">{DEPT_LABELS[d]}</span>
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-[10px] text-slate-400">{stageTasks.filter(t=>t.status==='completed').length}/{stageTasks.length}</span>
                            <Button size="sm" variant="ghost" className="h-6 text-[10px] gap-1 text-slate-300 hover:text-white hover:bg-slate-700 px-2" onClick={() => openNewTask(phase.number, stage.number, stage.name)}>
                              <Plus className="w-3 h-3" /> Add
                            </Button>
                          </div>
                        </div>
                        {/* Column headers */}
                        <div className="flex items-center gap-3 px-3 py-1.5 bg-muted/60 border-b border-border text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                          <span className="w-8">#</span>
                          <span className="flex-1">Checklist Item</span>
                          <span className="w-20 text-right hidden md:block">Status</span>
                          <span className="w-24 text-right hidden md:block">Assigned To</span>
                          <span className="w-20 text-right hidden md:block">Due / Done</span>
                        </div>
                            <div className="space-y-1">
                              {stageTasks.length === 0 ? (
                                <p className="text-xs text-muted-foreground italic py-2 pl-2">No tasks — add tasks or initialize workflow</p>
                              ) : stageTasks
                                  .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
                                  .map((task, taskIdx) => {
                                const StatusIcon = taskStatusConfig[task.status]?.icon || Circle;
                                const taskNum = `${stage.number}.${(task.order_index || taskIdx + 1)}`;
                                const isWarning = task.task_name.startsWith('⚠');
                                return (
                                  <div key={task.id} className={cn("flex items-center gap-3 px-3 py-2.5 border-b border-border/40 hover:bg-muted/40 transition-colors group", isWarning && "bg-rose-50/50 dark:bg-rose-950/20")}>
                                    <span className="text-[10px] text-muted-foreground w-8 flex-shrink-0 font-mono">{taskNum}</span>
                                    <button className="flex-shrink-0" onClick={() => {
                                      const next = task.status === 'pending' ? 'in_progress' : task.status === 'in_progress' ? 'completed' : 'pending';
                                      updateTaskStatus(task, next);
                                    }}>
                                      <StatusIcon className={cn("w-4 h-4", taskStatusConfig[task.status]?.class, task.status === 'in_progress' && "animate-spin")} />
                                    </button>
                                    <div className="flex-1 min-w-0">
                                      <p className={cn("text-sm", task.status === 'completed' ? 'line-through text-muted-foreground' : isWarning ? 'text-rose-700 dark:text-rose-400 font-medium' : 'text-foreground')}>
                                        {task.task_name}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                      <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium capitalize", taskStatusConfig[task.status]?.class, "bg-transparent border-0")}>
                                        {taskStatusConfig[task.status]?.label || 'Pending'}
                                      </span>
                                      {task.assigned_to && <span className="text-[10px] text-muted-foreground hidden md:inline">{task.assigned_to}</span>}
                                      {task.due_date && <span className="text-[10px] text-muted-foreground hidden md:inline">{new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
                                      {task.requires_approval && <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded hidden sm:inline">Approval</span>}
                                      <button className="opacity-0 group-hover:opacity-100 text-[10px] text-muted-foreground hover:text-foreground transition-all" onClick={() => openEditTask(task)}>Edit</button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Task Modal */}
      <Dialog open={showTaskModal} onOpenChange={setShowTaskModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="font-jakarta">{editingTask ? 'Edit Task' : 'Add Task'}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-1.5">
              <Label>Task Name *</Label>
              <Input value={taskForm.task_name || ''} onChange={e => setTaskForm({...taskForm, task_name: e.target.value})} placeholder="Describe the task..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Assigned Dept(s)</Label>
                <div className="flex flex-wrap gap-1 min-h-[36px] items-center px-3 py-2 rounded-md border border-input bg-muted/40">
                  {(STAGE_DEPARTMENTS[taskForm.stage_number] || []).length > 0 ? (
                    STAGE_DEPARTMENTS[taskForm.stage_number].map(d => (
                      <span key={d} className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium", DEPT_COLORS[d])}>{DEPT_LABELS[d]}</span>
                    ))
                  ) : <span className="text-xs text-muted-foreground italic">Auto-assigned</span>}
                </div>
                <p className="text-[10px] text-muted-foreground">Auto-assigned · system controlled</p>
              </div>
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Select value={taskForm.priority} onValueChange={v => setTaskForm({...taskForm, priority: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem><SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={taskForm.status} onValueChange={v => setTaskForm({...taskForm, status: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(taskStatusConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Due Date</Label>
                <Input type="date" value={taskForm.due_date || ''} onChange={e => setTaskForm({...taskForm, due_date: e.target.value})} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Assigned To</Label>
              <Input placeholder="Team member name" value={taskForm.assigned_to || ''} onChange={e => setTaskForm({...taskForm, assigned_to: e.target.value})} />
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea rows={3} value={taskForm.notes || ''} onChange={e => setTaskForm({...taskForm, notes: e.target.value})} />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setShowTaskModal(false)}>Cancel</Button>
            <Button onClick={saveTask} disabled={saving} className="gradient-gold text-white border-0">{saving ? 'Saving...' : 'Save Task'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}