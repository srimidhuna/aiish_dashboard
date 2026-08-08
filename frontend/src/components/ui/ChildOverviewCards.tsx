import { Card, CardHeader, CardTitle, CardContent } from './Card';
import { Child, Hospital } from '../../types';

interface ChildOverviewCardsProps {
  child: Child;
  hospital?: Hospital;
}

export function ChildOverviewCards({ child, hospital }: ChildOverviewCardsProps) {
  return (
    <Card className="overflow-hidden">
      <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x border-b">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4 text-foreground/90">Parent Information</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-start">
              <span className="text-muted-foreground">Mother&apos;s Name:</span>
              <span className="font-medium text-right">{child.motherName}</span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-muted-foreground">Father&apos;s Name:</span>
              <span className="font-medium text-right">{child.fatherName || '—'}</span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-muted-foreground">Contact:</span>
              <span className="font-medium text-right">{child.contactNumber || '—'}</span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-muted-foreground">Alternate Phone:</span>
              <span className="font-medium text-right">{child.phone2 || '—'}</span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-muted-foreground">Address:</span>
              <span className="font-medium text-right w-2/3 break-words">{child.address || '—'}</span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-muted-foreground">Taluk / District:</span>
              <span className="font-medium text-right">{[child.taluk, child.parentDistrict].filter(Boolean).join(' / ') || '—'}</span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-muted-foreground">State / PIN:</span>
              <span className="font-medium text-right">{[child.parentState, child.pinCode].filter(Boolean).join(' - ') || '—'}</span>
            </div>
          </div>
        </div>

        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4 text-foreground/90">Birth Details</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-start">
              <span className="text-muted-foreground">Date of Birth:</span>
              <span className="font-medium text-right">{child.dateOfBirth ? new Date(child.dateOfBirth).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-muted-foreground">Gender:</span>
              <span className="font-medium text-right capitalize">{child.gender}</span>
            </div>

          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x border-b">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4 text-foreground/90">Hospital & Care Team</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-start">
              <span className="text-muted-foreground">Hospital:</span>
              <span className="font-medium text-right">{hospital?.name || child.district || '—'}</span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-muted-foreground">State / District:</span>
              <span className="font-medium text-right">{[child.state, child.district].filter(Boolean).join(' / ') || '—'}</span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-muted-foreground">Assessing Staff:</span>
              <span className="font-medium text-right">
                {child.assessingStaffName ? `${child.assessingStaffName} (${child.assessingStaffEmployeeId || '—'})` : '—'}
              </span>
            </div>
          </div>
        </div>

        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4 text-foreground/90">Socio-Demographics</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-start">
              <span className="text-muted-foreground">Referred By:</span>
              <span className="font-medium text-right capitalize">
                {child.referredBy === 'others' ? child.referredByOther : child.referredBy?.replace(/_/g, ' ') || '—'}
              </span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-muted-foreground">NBS Centre:</span>
              <span className="font-medium text-right">{child.hospital?.name || child.nbsCentre || '—'}</span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-muted-foreground">Region / SES:</span>
              <span className="font-medium text-right uppercase">
                {[child.region, child.socioEconomicStatus].filter(Boolean).join(' / ') || '—'}
              </span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-muted-foreground">Education Level:</span>
              <span className="font-medium text-right capitalize">{child.educationLevel?.replace(/_/g, ' ') || '—'}</span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-muted-foreground">Religion:</span>
              <span className="font-medium text-right capitalize">{child.religion || '—'}</span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-muted-foreground">Delivery / Siblings:</span>
              <span className="font-medium text-right capitalize">
                {[child.deliveryType, child.noOfSiblings != null ? `${child.noOfSiblings} sibling(s)` : null].filter(Boolean).join(' / ') || '—'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 bg-slate-50/50">
        <h3 className="text-lg font-semibold mb-4 text-foreground/90">Registration Info</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
          <div>
            <p className="text-muted-foreground text-xs mb-1 uppercase tracking-wider font-semibold">MR / Hospital No.</p>
            <p className="font-semibold text-base">{child.hospitalNumber || '—'}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs mb-1 uppercase tracking-wider font-semibold">POCD Number</p>
            <p className="font-semibold text-base">{child.pocdNumber || '—'}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs mb-1 uppercase tracking-wider font-semibold">Unique Mother ID</p>
            <p className="font-semibold font-mono text-base">{child.uniqueMotherId || '—'}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs mb-1 uppercase tracking-wider font-semibold">Registered On</p>
            <p className="font-semibold text-base">
              {new Date(child.createdAt).toLocaleDateString('en-IN', {
                day: '2-digit', month: 'short', year: 'numeric'
              })}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
