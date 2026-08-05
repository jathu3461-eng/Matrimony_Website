import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

export default function FieldMessage({ error, help, success, id }) {
  if (error) {
    return (
      <div className="field-error animate-[fade-in-up_0.2s_ease-out_both]" role="alert" id={id}>
        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
        <span>{error}</span>
      </div>
    );
  }
  if (success) {
    return (
      <div className="field-success" id={id}>
        <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
        <span>{success}</span>
      </div>
    );
  }
  if (help) {
    return (
      <div className="field-help" id={id}>
        <Info className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span>{help}</span>
      </div>
    );
  }
  return null;
}
