import { Card, CardHeader, CardTitle, CardContent } from './Card';
import { Child, Hospital } from '../../types';

interface ChildOverviewCardsProps {
  child: Child;
  hospital?: Hospital;
}

export function ChildOverviewCards({ child, hospital }: ChildOverviewCardsProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Parent Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between py-1 border-b">
            <span className="text-muted-foreground">Mother&apos;s Name:</span>{' '}
            <span>{child.motherName}</span>
          </div>
          <div className="flex justify-between py-1 border-b">
            <span className="text-muted-foreground">Father&apos;s Name:</span>{' '}
            <span>{child.fatherName || '—'}</span>
          </div>
          <div className="flex justify-between py-1 border-b">
            <span className="text-muted-foreground">Contact:</span>{' '}
            <span>{child.contactNumber || '—'}</span>
          </div>
          <div className="flex justify-between py-1 border-b">
            <span className="text-muted-foreground">Alternate Phone:</span>{' '}
            <span>{child.phone2 || '—'}</span>
          </div>
          <div className="flex justify-between py-1 border-b">
            <span className="text-muted-foreground">Email:</span>{' '}
            <span>{child.email || '—'}</span>
          </div>
          <div className="flex justify-between py-1 border-b">
            <span className="text-muted-foreground">Address:</span>{' '}
            <span className="text-right w-1/2 break-words">{child.address || '—'}</span>
          </div>
          <div className="flex justify-between py-1 border-b">
            <span className="text-muted-foreground">Taluk:</span>{' '}
            <span>{child.taluk || '—'}</span>
          </div>
          <div className="flex justify-between py-1 border-b">
            <span className="text-muted-foreground">PIN Code:</span>{' '}
            <span>{child.pinCode || '—'}</span>
          </div>
          <div className="flex justify-between py-1 border-b">
            <span className="text-muted-foreground">Parent District:</span>{' '}
            <span>{child.parentDistrict || '—'}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-muted-foreground">Parent State:</span>{' '}
            <span>{child.parentState || '—'}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Birth Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between py-1 border-b">
            <span className="text-muted-foreground">Date of Birth:</span>{' '}
            <span>{child.dateOfBirth ? new Date(child.dateOfBirth).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</span>
          </div>
          <div className="flex justify-between py-1 border-b">
            <span className="text-muted-foreground">Time of Birth:</span>{' '}
            <span>{child.timeOfBirth || '—'}</span>
          </div>
          <div className="flex justify-between py-1 border-b">
            <span className="text-muted-foreground">Gender:</span>{' '}
            <span className="capitalize">{child.gender}</span>
          </div>
          <div className="flex justify-between py-1 border-b">
            <span className="text-muted-foreground">Birth Weight:</span>{' '}
            <span>{child.birthWeightGrams != null ? `${child.birthWeightGrams} g` : '—'}</span>
          </div>
          <div className="flex justify-between py-1 border-b">
            <span className="text-muted-foreground">Gestational Age:</span>{' '}
            <span>{child.gestationalAgeWeeks != null ? `${child.gestationalAgeWeeks} weeks` : '—'}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-muted-foreground">Place of Birth:</span>{' '}
            <span>{child.placeOfBirth || '—'}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Hospital & Care Team</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between py-1 border-b">
            <span className="text-muted-foreground">Hospital:</span>{' '}
            <span>{hospital?.name || child.district || '—'}</span>
          </div>
          <div className="flex justify-between py-1 border-b">
            <span className="text-muted-foreground">State:</span>{' '}
            <span>{child.state || '—'}</span>
          </div>
          <div className="flex justify-between py-1 border-b">
            <span className="text-muted-foreground">District:</span>{' '}
            <span>{child.district || '—'}</span>
          </div>
          <div className="flex justify-between py-1 border-b">
            <span className="text-muted-foreground">Assessing Staff ID:</span>{' '}
            <span className="font-mono">{child.assessingStaffEmployeeId || '—'}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-muted-foreground">Assessing Staff Name:</span>{' '}
            <span>{child.assessingStaffName || '—'}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Socio-Demographics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between py-1 border-b">
            <span className="text-muted-foreground">Referred By:</span>{' '}
            <span className="capitalize">{child.referredBy?.replace(/_/g, ' ') || '—'}</span>
          </div>
          {child.referredBy === 'others' && (
            <div className="flex justify-between py-1 border-b">
              <span className="text-muted-foreground">Referred By (specify):</span>{' '}
              <span>{child.referredByOther || '—'}</span>
            </div>
          )}
          <div className="flex justify-between py-1 border-b">
            <span className="text-muted-foreground">NBS Centre:</span>{' '}
            <span>{child.nbsCentre || '—'}</span>
          </div>
          <div className="flex justify-between py-1 border-b">
            <span className="text-muted-foreground">Region:</span>{' '}
            <span className="capitalize">{child.region || '—'}</span>
          </div>
          <div className="flex justify-between py-1 border-b">
            <span className="text-muted-foreground">Socio-Economic Status:</span>{' '}
            <span className="uppercase">{child.socioEconomicStatus || '—'}</span>
          </div>
          <div className="flex justify-between py-1 border-b">
            <span className="text-muted-foreground">Education Level:</span>{' '}
            <span className="capitalize">{child.educationLevel?.replace(/_/g, ' ') || '—'}</span>
          </div>
          <div className="flex justify-between py-1 border-b">
            <span className="text-muted-foreground">Religion:</span>{' '}
            <span className="capitalize">{child.religion || '—'}</span>
          </div>
          <div className="flex justify-between py-1 border-b">
            <span className="text-muted-foreground">Delivery Type:</span>{' '}
            <span className="capitalize">{child.deliveryType || '—'}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-muted-foreground">No. of Siblings:</span>{' '}
            <span>{child.noOfSiblings != null ? child.noOfSiblings : '—'}</span>
          </div>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Registration Info</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground text-xs mb-0.5">MR / Hospital No.</p>
            <p className="font-medium">{child.hospitalNumber || '—'}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs mb-0.5">POCD Number</p>
            <p className="font-medium">{child.pocdNumber || '—'}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs mb-0.5">Unique Mother ID</p>
            <p className="font-medium font-mono">{child.uniqueMotherId || '—'}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs mb-0.5">Registered On</p>
            <p className="font-medium">
              {new Date(child.createdAt).toLocaleDateString('en-IN', {
                day: '2-digit', month: 'short', year: 'numeric'
              })}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
