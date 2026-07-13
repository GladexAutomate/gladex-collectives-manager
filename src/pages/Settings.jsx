// @ts-nocheck
import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import {
  User, Shield, Bell, Palette, Workflow, Globe,
  Save, CheckCircle, Moon, Sun, Upload, Eye, EyeOff, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'system', label: 'System', icon: Globe },
];

function SaveIndicator({ saving, saved }) {
  if (saving) return <span className="text-xs text-muted-foreground flex items-center gap-1"><RefreshCw className="w-3 h-3 animate-spin" /> Saving…</span>;
  if (saved) return <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Saved!</span>;
  return null;
}

function ToggleSwitch({ checked, onChange, label, description }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="flex-1">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={cn(
          "relative w-11 h-6 rounded-full transition-colors flex-shrink-0 focus:outline-none",
          checked ? "bg-amber-500" : "bg-muted"
        )}
      >
        <span className={cn(
          "absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform",
          checked ? "translate-x-5" : "translate-x-0"
        )} />
      </button>
    </div>
  );
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [user, setUser] = useState(null);

  // Profile
  const [profile, setProfile] = useState({ full_name: '', email: '', phone: '', department: '', role_title: '' });

  // Appearance
  const [appearance, setAppearance] = useState({
    dark_mode: false, compact_layout: false, sidebar_collapsed: false, language: 'en'
  });

  // Notifications
  const [notifications, setNotifications] = useState({
    email_alerts: true, deadline_reminders: true, payment_notifications: true,
    booking_updates: true, workflow_alerts: true, marketing_updates: false, weekly_reports: true,
  });

  // Security
  const [security, setSecurity] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [showPw, setShowPw] = useState(false);
  const [pwError, setPwError] = useState('');

  // System
  const [system, setSystem] = useState({
    company_name: 'GLADEX Group', currency: 'PHP', timezone: 'Asia/Manila',
    auto_save: true, session_timeout: '60', default_pax: '20',
  });

  useEffect(() => {
    base44.auth.me().then(u => {
      if (u) {
        setUser(u);
        setProfile({
          full_name: u.full_name || '',
          email: u.email || '',
          phone: u.phone || '',
          department: u.department || '',
          role_title: u.role_title || '',
        });
        if (u.preferences) {
          if (u.preferences.appearance) setAppearance(prev => ({ ...prev, ...u.preferences.appearance }));
          if (u.preferences.notifications) setNotifications(prev => ({ ...prev, ...u.preferences.notifications }));
          if (u.preferences.system) setSystem(prev => ({ ...prev, ...u.preferences.system }));
        }
      }
    }).catch(() => {});
  }, []);

  const showSaved = () => { setSaved(true); setTimeout(() => setSaved(false), 2500); };

  const saveProfile = async () => {
    setSaving(true);
    await base44.auth.updateMe({ phone: profile.phone, department: profile.department, role_title: profile.role_title });
    setSaving(false);
    showSaved();
  };

  const saveAppearance = async () => {
    setSaving(true);
    await base44.auth.updateMe({ preferences: { ...(user?.preferences || {}), appearance } });
    if (appearance.dark_mode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    setSaving(false);
    showSaved();
  };

  const saveNotifications = async () => {
    setSaving(true);
    await base44.auth.updateMe({ preferences: { ...(user?.preferences || {}), notifications } });
    setSaving(false);
    showSaved();
  };

  const saveSystem = async () => {
    setSaving(true);
    await base44.auth.updateMe({ preferences: { ...(user?.preferences || {}), system } });
    setSaving(false);
    showSaved();
  };

  const changePassword = async () => {
    setPwError('');
    if (!security.new_password || security.new_password.length < 6) { setPwError('New password must be at least 6 characters.'); return; }
    if (security.new_password !== security.confirm_password) { setPwError('Passwords do not match.'); return; }
    setSaving(true);
    try {
      await base44.auth.updateMe({ password: security.new_password });
      setSecurity({ current_password: '', new_password: '', confirm_password: '' });
      showSaved();
    } catch {
      setPwError('Password change failed. Please try again.');
    }
    setSaving(false);
  };

  return (
    <div className="space-y-5 pb-6">
      <div>
        <h2 className="text-xl font-bold font-jakarta text-foreground">Settings</h2>
        <p className="text-sm text-muted-foreground">Manage your account, preferences, and system configuration</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar nav */}
        <aside className="lg:w-52 flex-shrink-0">
          <nav className="flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all text-left",
                  activeTab === id
                    ? "bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="bg-card rounded-2xl border border-border p-6 space-y-6">

            {/* PROFILE TAB */}
            {activeTab === 'profile' && (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold font-jakarta text-foreground">Profile Settings</h3>
                  <SaveIndicator saving={saving} saved={saved} />
                </div>

                <div className="flex items-center gap-4 pb-4 border-b border-border">
                  <div className="w-16 h-16 rounded-full gradient-gold flex items-center justify-center text-white text-2xl font-bold">
                    {profile.full_name?.charAt(0)?.toUpperCase() || 'A'}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{profile.full_name || 'Admin User'}</p>
                    <p className="text-sm text-muted-foreground">{profile.email}</p>
                    <p className="text-xs text-muted-foreground capitalize mt-0.5">{user?.role || 'admin'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Full Name</Label>
                    <Input value={profile.full_name} disabled className="bg-muted/30 cursor-not-allowed" />
                    <p className="text-[11px] text-muted-foreground">Managed by your authentication provider</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Email</Label>
                    <Input value={profile.email} disabled className="bg-muted/30 cursor-not-allowed" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Phone Number</Label>
                    <Input placeholder="+63 9XX XXX XXXX" value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Department</Label>
                    <Select value={profile.department} onValueChange={v => setProfile({ ...profile, department: v })}>
                      <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="management">Management</SelectItem>
                        <SelectItem value="product_development">Product Development</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="sales">Sales</SelectItem>
                        <SelectItem value="accounting">Accounting</SelectItem>
                        <SelectItem value="operations">Operations</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>Role / Position Title</Label>
                    <Input placeholder="e.g. Product Manager, Marketing Lead" value={profile.role_title} onChange={e => setProfile({ ...profile, role_title: e.target.value })} />
                  </div>
                </div>

                <Button onClick={saveProfile} disabled={saving} className="gradient-gold text-white border-0 gap-2">
                  {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Profile
                </Button>
              </>
            )}

            {/* APPEARANCE TAB */}
            {activeTab === 'appearance' && (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold font-jakarta text-foreground">Appearance</h3>
                  <SaveIndicator saving={saving} saved={saved} />
                </div>

                <div className="divide-y divide-border">
                  <ToggleSwitch
                    checked={appearance.dark_mode}
                    onChange={v => setAppearance({ ...appearance, dark_mode: v })}
                    label="Dark Mode"
                    description="Switch to dark theme for low-light environments"
                  />
                  <ToggleSwitch
                    checked={appearance.compact_layout}
                    onChange={v => setAppearance({ ...appearance, compact_layout: v })}
                    label="Compact Layout"
                    description="Reduce spacing for more content density"
                  />
                  <ToggleSwitch
                    checked={appearance.sidebar_collapsed}
                    onChange={v => setAppearance({ ...appearance, sidebar_collapsed: v })}
                    label="Collapse Sidebar by Default"
                    description="Start with the sidebar minimized on each session"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Language</Label>
                  <Select value={appearance.language} onValueChange={v => setAppearance({ ...appearance, language: v })}>
                    <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="fil">Filipino</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={saveAppearance} disabled={saving} className="gradient-gold text-white border-0 gap-2">
                  <Save className="w-4 h-4" /> Save Appearance
                </Button>
              </>
            )}

            {/* NOTIFICATIONS TAB */}
            {activeTab === 'notifications' && (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold font-jakarta text-foreground">Notification Preferences</h3>
                  <SaveIndicator saving={saving} saved={saved} />
                </div>

                <div className="divide-y divide-border">
                  <ToggleSwitch checked={notifications.email_alerts} onChange={v => setNotifications({ ...notifications, email_alerts: v })} label="Email Alerts" description="Receive important alerts via email" />
                  <ToggleSwitch checked={notifications.deadline_reminders} onChange={v => setNotifications({ ...notifications, deadline_reminders: v })} label="Deadline Reminders" description="Get notified before task and supplier deadlines" />
                  <ToggleSwitch checked={notifications.payment_notifications} onChange={v => setNotifications({ ...notifications, payment_notifications: v })} label="Payment Notifications" description="Alerts for new payments and verification requests" />
                  <ToggleSwitch checked={notifications.booking_updates} onChange={v => setNotifications({ ...notifications, booking_updates: v })} label="Booking Updates" description="Notify when bookings are created or updated" />
                  <ToggleSwitch checked={notifications.workflow_alerts} onChange={v => setNotifications({ ...notifications, workflow_alerts: v })} label="Workflow Alerts" description="Alerts when checklist tasks are assigned or completed" />
                  <ToggleSwitch checked={notifications.marketing_updates} onChange={v => setNotifications({ ...notifications, marketing_updates: v })} label="Marketing Updates" description="Notify when marketing assets are published" />
                  <ToggleSwitch checked={notifications.weekly_reports} onChange={v => setNotifications({ ...notifications, weekly_reports: v })} label="Weekly Reports" description="Receive a weekly performance summary" />
                </div>

                <Button onClick={saveNotifications} disabled={saving} className="gradient-gold text-white border-0 gap-2">
                  <Save className="w-4 h-4" /> Save Preferences
                </Button>
              </>
            )}

            {/* SECURITY TAB */}
            {activeTab === 'security' && (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold font-jakarta text-foreground">Security Settings</h3>
                  <SaveIndicator saving={saving} saved={saved} />
                </div>

                <div className="space-y-4 max-w-md">
                  <div className="p-4 bg-muted/30 rounded-lg border border-border space-y-1">
                    <p className="text-sm font-medium text-foreground">Account Role</p>
                    <p className="text-xs text-muted-foreground">Your current role: <span className="font-semibold text-amber-600 dark:text-amber-400 capitalize">{user?.role || 'admin'}</span></p>
                    <p className="text-xs text-muted-foreground">Role changes are managed by the system administrator.</p>
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-foreground">Change Password</p>

                    <div className="space-y-1.5 relative">
                      <Label>New Password</Label>
                      <div className="relative">
                        <Input
                          type={showPw ? 'text' : 'password'}
                          placeholder="Minimum 6 characters"
                          value={security.new_password}
                          onChange={e => setSecurity({ ...security, new_password: e.target.value })}
                          className="pr-10"
                        />
                        <button onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                          {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label>Confirm New Password</Label>
                      <Input
                        type="password"
                        placeholder="Repeat new password"
                        value={security.confirm_password}
                        onChange={e => setSecurity({ ...security, confirm_password: e.target.value })}
                      />
                    </div>

                    {pwError && <p className="text-xs text-rose-500">{pwError}</p>}

                    <Button onClick={changePassword} disabled={saving || !security.new_password} className="gradient-gold text-white border-0 gap-2">
                      <Shield className="w-4 h-4" /> Update Password
                    </Button>
                  </div>

                  <div className="p-4 bg-muted/30 rounded-lg border border-border space-y-2">
                    <p className="text-sm font-medium text-foreground">Active Session</p>
                    <p className="text-xs text-muted-foreground">Last login: <span className="font-medium text-foreground">{new Date().toLocaleDateString('en-PH', { dateStyle: 'medium' })}</span></p>
                    <p className="text-xs text-muted-foreground">Session is active. Use logout to end your session.</p>
                    <Button size="sm" variant="outline" className="text-xs text-rose-500 border-rose-200 hover:bg-rose-50 dark:border-rose-900 dark:hover:bg-rose-950/25 mt-1" onClick={() => base44.auth.logout()}>
                      Logout
                    </Button>
                  </div>
                </div>
              </>
            )}

            {/* SYSTEM TAB */}
            {activeTab === 'system' && (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold font-jakarta text-foreground">System Configuration</h3>
                  <SaveIndicator saving={saving} saved={saved} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>Company / Agency Name</Label>
                    <Input value={system.company_name} onChange={e => setSystem({ ...system, company_name: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Default Currency</Label>
                    <Select value={system.currency} onValueChange={v => setSystem({ ...system, currency: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PHP">PHP – Philippine Peso</SelectItem>
                        <SelectItem value="USD">USD – US Dollar</SelectItem>
                        <SelectItem value="EUR">EUR – Euro</SelectItem>
                        <SelectItem value="JPY">JPY – Japanese Yen</SelectItem>
                        <SelectItem value="KRW">KRW – Korean Won</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Timezone</Label>
                    <Select value={system.timezone} onValueChange={v => setSystem({ ...system, timezone: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Asia/Manila">Asia/Manila (PHT)</SelectItem>
                        <SelectItem value="UTC">UTC</SelectItem>
                        <SelectItem value="Asia/Tokyo">Asia/Tokyo (JST)</SelectItem>
                        <SelectItem value="Asia/Seoul">Asia/Seoul (KST)</SelectItem>
                        <SelectItem value="Asia/Singapore">Asia/Singapore (SGT)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Default Package Slots</Label>
                    <Input type="number" min="1" value={system.default_pax} onChange={e => setSystem({ ...system, default_pax: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Session Timeout (minutes)</Label>
                    <Select value={system.session_timeout} onValueChange={v => setSystem({ ...system, session_timeout: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                        <SelectItem value="120">2 hours</SelectItem>
                        <SelectItem value="480">8 hours</SelectItem>
                        <SelectItem value="0">Never</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="divide-y divide-border">
                  <ToggleSwitch
                    checked={system.auto_save}
                    onChange={v => setSystem({ ...system, auto_save: v })}
                    label="Auto-Save Drafts"
                    description="Automatically save changes in EZQuote and forms"
                  />
                </div>

                <Button onClick={saveSystem} disabled={saving} className="gradient-gold text-white border-0 gap-2">
                  <Save className="w-4 h-4" /> Save System Settings
                </Button>
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}