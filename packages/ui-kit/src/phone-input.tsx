import { AsYouType, type CountryCode, getCountryCallingCode, getExampleNumber, parsePhoneNumberFromString } from 'libphonenumber-js';
import { getCountries } from 'libphonenumber-js/core';
import metadata from 'libphonenumber-js/metadata.min.json';
import examples from 'libphonenumber-js/mobile/examples';
import { ChevronDown } from 'lucide-react';
import { forwardRef, useEffect, useRef, useState } from 'react';
import { Button } from './button';
import { ButtonGroup } from './button-group';
import { CountryFlag } from './components/country-flag';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './dropdown-menu';
import { useCountryName } from './hooks/use-country-name';
import { Input } from './input';
import { cn } from './utils';

type PhoneInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange' | 'placeholder'> & {
  value?: string;
  onChange?: (value: string) => void;
  defaultCountry?: CountryCode;
  error?: boolean;
};

// Helper function to format phone number for display
function formatPhoneForDisplay(value: string, country: CountryCode): string {
  if (!value) return '';
  
  try {
    // Try to parse as international format first
    const parsed = parsePhoneNumberFromString(value);
    if (parsed?.country) {
      const formatter = new AsYouType(parsed.country);
      return formatter.input(value);
    }
    
    // Fallback: try with provided country
    const parsedWithCountry = parsePhoneNumberFromString(value, country);
    if (parsedWithCountry?.country) {
      const formatter = new AsYouType(parsedWithCountry.country);
      return formatter.input(value);
    }
    
    return value;
  } catch {
    return value;
  }
}

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ className, value = '', onChange, defaultCountry = 'CH', error, disabled, ...props }, ref) => {
    // Initialize country from value if available, otherwise use default
    const getInitialCountry = (): CountryCode => {
      if (value) {
        try {
          const parsed = parsePhoneNumberFromString(value);
          if (parsed?.country) {
            return parsed.country;
          }
        } catch {
          // ignore
        }
      }
      return defaultCountry;
    };

    const [selectedCountry, setSelectedCountry] = useState<CountryCode>(getInitialCountry());
    const [phoneNumber, setPhoneNumber] = useState(() => formatPhoneForDisplay(value, getInitialCountry()));
    const [isOpen, setIsOpen] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const formatter = new AsYouType(selectedCountry);
    const { getCountryName } = useCountryName();

    // Sync external value changes
    useEffect(() => {
      if (value !== phoneNumber) {
        const formatted = formatPhoneForDisplay(value, selectedCountry);
        if (formatted !== phoneNumber) {
          setPhoneNumber(formatted);
        }
        
        // Update country if value contains country info
        if (value) {
          try {
            const parsed = parsePhoneNumberFromString(value);
            if (parsed?.country && parsed.country !== selectedCountry) {
              setSelectedCountry(parsed.country);
            }
          } catch {
            // ignore
          }
        }
      }
    }, [value, selectedCountry, phoneNumber]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      const formatted = formatter.input(inputValue);
      setPhoneNumber(formatted);
      
      // Convert to international ISO format (E.164) for storage
      try {
        const parsed = parsePhoneNumberFromString(formatted, selectedCountry);
        if (parsed?.isValid()) {
          onChange?.(parsed.number);
        } else {
          onChange?.(formatted);
        }
      } catch {
        onChange?.(formatted);
      }
    };

    const handleCountrySelect = (country: CountryCode) => {
      setSelectedCountry(country);
      setIsOpen(false);
      // Re-format the current number with the new country
      if (phoneNumber) {
        const formatter = new AsYouType(country);
        const formatted = formatter.input(phoneNumber);
        setPhoneNumber(formatted);
        
        // Convert to international ISO format (E.164) for storage
        try {
          const parsed = parsePhoneNumberFromString(formatted, country);
          if (parsed?.isValid()) {
            onChange?.(parsed.number);
          } else {
            onChange?.(formatted);
          }
        } catch {
          onChange?.(formatted);
        }
      }
      inputRef.current?.focus();
    };


    // Get countries and sort by name
    const countries = getCountries(metadata)
      .map((country) => ({
        code: country,
        name: getCountryName(country),
      }))
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((item) => item.code);

    // Get example number for selected country using libphonenumber-js
    const examplePhoneNumber = getExampleNumber(selectedCountry, examples);
    const placeholder = examplePhoneNumber?.formatNational() || `+${getCountryCallingCode(selectedCountry)} 123 456 7890`;

    return (
      <ButtonGroup className={cn('w-full', className)}>
        <DropdownMenu open={isOpen} onOpenChange={disabled ? undefined : setIsOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="md"
              className="gap-1.5 px-3"
              disabled={disabled}
            >
              <CountryFlag countryCode={selectedCountry.toUpperCase()} />
              <ChevronDown className="size-3 text-slate-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="max-h-[300px] overflow-y-auto">
            {countries.map((country) => (
              <DropdownMenuItem
                key={country}
                onClick={() => handleCountrySelect(country)}
                className={cn(
                  'flex items-center gap-2',
                  selectedCountry === country && 'bg-brand-500/10'
                )}
              >
                <CountryFlag countryCode={country} size="sm" />
                <span className="flex-1">{getCountryName(country)}</span>
                <span className="text-slate-400 text-xs">+{getCountryCallingCode(country)}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <Input
          ref={ref || inputRef}
          type="tel"
          value={phoneNumber}
          onChange={handleInputChange}
          aria-invalid={error}
          disabled={disabled}
          {...props}
          placeholder={placeholder}
        />
      </ButtonGroup>
    );
  }
);

PhoneInput.displayName = 'PhoneInput';

