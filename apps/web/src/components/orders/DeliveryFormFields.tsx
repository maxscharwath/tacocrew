import { Globe, Hash, MapPin, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { DeliveryType } from '@/components/orders/DeliveryTypeSelector';
import { DeliveryTypeSelector } from '@/components/orders/DeliveryTypeSelector';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  Label,
  PhoneInput,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';
import {
  getSwissCantons,
  getSwitzerlandName,
  SWITZERLAND_COUNTRY,
  type SwissCanton,
} from '@/constants/location';

type DeliveryFormFieldsProps = {
  readonly customerName: string;
  readonly setCustomerName: (value: string) => void;
  readonly customerPhone: string;
  readonly setCustomerPhone: (value: string) => void;
  readonly deliveryType: DeliveryType;
  readonly setDeliveryType: (value: DeliveryType) => void;
  readonly road: string;
  readonly setRoad: (value: string) => void;
  readonly houseNumber: string;
  readonly setHouseNumber: (value: string) => void;
  readonly postcode: string;
  readonly setPostcode: (value: string) => void;
  readonly city: string;
  readonly setCity: (value: string) => void;
  readonly stateRegion: SwissCanton;
  readonly setStateRegion: (value: SwissCanton) => void;
  readonly disabled?: boolean;
};

export function DeliveryFormFields({
  customerName,
  setCustomerName,
  customerPhone,
  setCustomerPhone,
  deliveryType,
  setDeliveryType,
  road,
  setRoad,
  houseNumber,
  setHouseNumber,
  postcode,
  setPostcode,
  city,
  setCity,
  stateRegion,
  setStateRegion,
  disabled = false,
}: DeliveryFormFieldsProps) {
  const { t } = useTranslation();

  return (
    <section className="space-y-4 rounded-2xl border border-white/10 bg-slate-900/50 p-3 sm:space-y-5 sm:p-5">
      <div className="space-y-1">
        <p className="font-semibold text-sm text-white">
          {t('orders.submit.form.sections.address.title')}
        </p>
        <p className="text-slate-400 text-xs">
          {t('orders.submit.form.sections.address.description')}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="customerName" required>
            {t('orders.submit.form.fields.customerName')}
          </Label>
          <InputGroup>
            <InputGroupAddon>
              <User className="size-4" />
            </InputGroupAddon>
            <InputGroupInput
              id="customerName"
              name="customerName"
              type="text"
              required
              disabled={disabled}
              value={customerName}
              onChange={(event) => setCustomerName(event.target.value)}
            />
          </InputGroup>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="customerPhone" required>
            {t('orders.submit.form.fields.customerPhone')}
          </Label>
          <PhoneInput
            id="customerPhone"
            name="customerPhone"
            required
            disabled={disabled}
            value={customerPhone}
            onChange={setCustomerPhone}
          />
        </div>
      </div>

      <DeliveryTypeSelector
        selected={deliveryType}
        onSelect={setDeliveryType}
        disabled={disabled}
        required
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="road" required>
            {t('orders.submit.form.fields.street')}
          </Label>
          <InputGroup>
            <InputGroupAddon>
              <MapPin className="size-4" />
            </InputGroupAddon>
            <InputGroupInput
              id="road"
              name="road"
              type="text"
              required
              disabled={disabled}
              value={road}
              onChange={(event) => setRoad(event.target.value)}
            />
          </InputGroup>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="houseNumber">{t('orders.submit.form.fields.houseNumber')}</Label>
          <InputGroup>
            <InputGroupAddon>
              <Hash className="size-4" />
            </InputGroupAddon>
            <InputGroupInput
              id="houseNumber"
              name="houseNumber"
              type="text"
              disabled={disabled}
              value={houseNumber}
              onChange={(event) => setHouseNumber(event.target.value)}
            />
          </InputGroup>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="postcode" required>
            {t('orders.submit.form.fields.postcode')}
          </Label>
          <InputGroup>
            <InputGroupAddon>
              <Hash className="size-4" />
            </InputGroupAddon>
            <InputGroupInput
              id="postcode"
              name="postcode"
              type="text"
              required
              disabled={disabled}
              value={postcode}
              onChange={(event) => setPostcode(event.target.value)}
            />
          </InputGroup>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="city" required>
            {t('orders.submit.form.fields.city')}
          </Label>
          <InputGroup>
            <InputGroupAddon>
              <MapPin className="size-4" />
            </InputGroupAddon>
            <InputGroupInput
              id="city"
              name="city"
              type="text"
              required
              disabled={disabled}
              value={city}
              onChange={(event) => setCity(event.target.value)}
            />
          </InputGroup>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="state">{t('orders.submit.form.fields.state')}</Label>
          <input type="hidden" name="state" value={stateRegion} />
          <Select
            value={stateRegion}
            onValueChange={(value) => setStateRegion(value as SwissCanton)}
            disabled={disabled}
          >
            <SelectTrigger id="state" className="w-full">
              <SelectValue placeholder={t('orders.submit.form.fields.state')} />
            </SelectTrigger>
            <SelectContent>
              {getSwissCantons(t).map((canton) => (
                <SelectItem key={canton.code} value={canton.code}>
                  {canton.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="country">{t('orders.submit.form.fields.country')}</Label>
          <InputGroup>
            <InputGroupAddon>
              <Globe className="size-4" />
            </InputGroupAddon>
            <InputGroupInput
              id="country"
              name="country"
              type="text"
              value={getSwitzerlandName(t)}
              readOnly
              disabled
            />
          </InputGroup>
        </div>
      </div>

      <input type="hidden" name="country" value={SWITZERLAND_COUNTRY} />
    </section>
  );
}
