'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import {
  Calendar,
  Clock,
  User,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Building2,
} from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from 'ada-design-system';
import { cn } from '@/lib/utils';

const STAFF_API = process.env.NEXT_PUBLIC_STAFF_API_URL || 'https://adastaff.mindgen.app';

// ─── i18n ────────────────────────────────────────────────────────────────────

type Locale = 'fr' | 'nl' | 'en' | 'es' | 'it';

const TRANSLATIONS: Record<Locale, Record<string, string>> = {
  fr: {
    loading: 'Chargement...',
    error: 'Erreur',
    retry: 'Réessayer',
    expired_title: 'Lien expiré',
    expired_text: 'Ce lien de réponse a expiré.',
    expired_contact: 'Veuillez contacter votre responsable directement.',
    invalid_link: "Ce lien n'est pas valide ou a déjà été utilisé.",
    load_error: 'Impossible de charger les détails.',
    connection_error: 'Erreur de connexion. Veuillez réessayer.',
    submit_error: "Impossible de soumettre votre réponse.",
    already_accepted: 'Déjà accepté',
    already_declined: 'Déjà refusé',
    already_text_accepted: 'Vous avez déjà accepté ce planning.',
    already_text_declined: 'Vous avez déjà refusé ce planning.',
    new_schedule: 'Nouveau planning',
    hello: 'Bonjour',
    new_schedule_desc: ', voici votre planning.',
    accept: 'Accepter le planning',
    decline: 'Refuser le planning',
    sending: 'Envoi en cours...',
    accepted_title: 'Planning accepté !',
    declined_title: 'Planning refusé',
    accepted_text: 'Votre responsable a été notifié. À bientôt !',
    declined_text: 'Votre responsable a été notifié de votre indisponibilité.',
    restaurant: 'Restaurant',
    date: 'Date',
    time: 'Horaire',
    position: 'Poste',
    not_specified: 'Non spécifié',
    your_shifts: 'Vos shifts cette semaine',
    shift_count: 'shift(s) cette semaine',
    powered_by: 'Powered by',
    day_0: 'dimanche', day_1: 'lundi', day_2: 'mardi', day_3: 'mercredi', day_4: 'jeudi', day_5: 'vendredi', day_6: 'samedi',
    month_0: 'janvier', month_1: 'février', month_2: 'mars', month_3: 'avril', month_4: 'mai', month_5: 'juin',
    month_6: 'juillet', month_7: 'août', month_8: 'septembre', month_9: 'octobre', month_10: 'novembre', month_11: 'décembre',
  },
  nl: {
    loading: 'Laden...',
    error: 'Fout',
    retry: 'Opnieuw proberen',
    expired_title: 'Link verlopen',
    expired_text: 'Deze link is verlopen.',
    expired_contact: 'Neem rechtstreeks contact op met je verantwoordelijke.',
    invalid_link: 'Deze link is niet geldig of werd al gebruikt.',
    load_error: 'Kan de details niet laden.',
    connection_error: 'Verbindingsfout. Probeer opnieuw.',
    submit_error: 'Kan je antwoord niet versturen.',
    already_accepted: 'Reeds geaccepteerd',
    already_declined: 'Reeds geweigerd',
    already_text_accepted: 'Je hebt dit rooster al geaccepteerd.',
    already_text_declined: 'Je hebt dit rooster al geweigerd.',
    new_schedule: 'Nieuw werkrooster',
    hello: 'Hallo',
    new_schedule_desc: ', hier is je werkrooster.',
    accept: 'Rooster accepteren',
    decline: 'Rooster weigeren',
    sending: 'Bezig met verzenden...',
    accepted_title: 'Rooster geaccepteerd!',
    declined_title: 'Rooster geweigerd',
    accepted_text: 'Je verantwoordelijke is op de hoogte gebracht. Tot binnenkort!',
    declined_text: 'Je verantwoordelijke is op de hoogte gebracht van je onbeschikbaarheid.',
    restaurant: 'Restaurant',
    date: 'Datum',
    time: 'Uur',
    position: 'Functie',
    not_specified: 'Niet gespecificeerd',
    your_shifts: 'Jouw shifts deze week',
    shift_count: 'shift(s) deze week',
    powered_by: 'Powered by',
    day_0: 'zondag', day_1: 'maandag', day_2: 'dinsdag', day_3: 'woensdag', day_4: 'donderdag', day_5: 'vrijdag', day_6: 'zaterdag',
    month_0: 'januari', month_1: 'februari', month_2: 'maart', month_3: 'april', month_4: 'mei', month_5: 'juni',
    month_6: 'juli', month_7: 'augustus', month_8: 'september', month_9: 'oktober', month_10: 'november', month_11: 'december',
  },
  en: {
    loading: 'Loading...',
    error: 'Error',
    retry: 'Retry',
    expired_title: 'Link expired',
    expired_text: 'This response link has expired.',
    expired_contact: 'Please contact your manager directly.',
    invalid_link: 'This link is not valid or has already been used.',
    load_error: 'Unable to load details.',
    connection_error: 'Connection error. Please try again.',
    submit_error: 'Unable to submit your response.',
    already_accepted: 'Already accepted',
    already_declined: 'Already declined',
    already_text_accepted: 'You have already accepted this schedule.',
    already_text_declined: 'You have already declined this schedule.',
    new_schedule: 'New schedule',
    hello: 'Hello',
    new_schedule_desc: ', here is your schedule.',
    accept: 'Accept schedule',
    decline: 'Decline schedule',
    sending: 'Sending...',
    accepted_title: 'Schedule accepted!',
    declined_title: 'Schedule declined',
    accepted_text: 'Your manager has been notified. See you soon!',
    declined_text: 'Your manager has been notified of your unavailability.',
    restaurant: 'Restaurant',
    date: 'Date',
    time: 'Time',
    position: 'Position',
    not_specified: 'Not specified',
    your_shifts: 'Your shifts this week',
    shift_count: 'shift(s) this week',
    powered_by: 'Powered by',
    day_0: 'Sunday', day_1: 'Monday', day_2: 'Tuesday', day_3: 'Wednesday', day_4: 'Thursday', day_5: 'Friday', day_6: 'Saturday',
    month_0: 'January', month_1: 'February', month_2: 'March', month_3: 'April', month_4: 'May', month_5: 'June',
    month_6: 'July', month_7: 'August', month_8: 'September', month_9: 'October', month_10: 'November', month_11: 'December',
  },
  es: {
    loading: 'Cargando...',
    error: 'Error',
    retry: 'Reintentar',
    expired_title: 'Enlace caducado',
    expired_text: 'Este enlace de respuesta ha caducado.',
    expired_contact: 'Por favor, contacte directamente con su responsable.',
    invalid_link: 'Este enlace no es válido o ya ha sido utilizado.',
    load_error: 'No se pueden cargar los detalles.',
    connection_error: 'Error de conexión. Inténtelo de nuevo.',
    submit_error: 'No se puede enviar su respuesta.',
    already_accepted: 'Ya aceptado',
    already_declined: 'Ya rechazado',
    already_text_accepted: 'Ya has aceptado este horario.',
    already_text_declined: 'Ya has rechazado este horario.',
    new_schedule: 'Nuevo horario',
    hello: 'Hola',
    new_schedule_desc: ', aquí está tu horario.',
    accept: 'Aceptar horario',
    decline: 'Rechazar horario',
    sending: 'Enviando...',
    accepted_title: '¡Horario aceptado!',
    declined_title: 'Horario rechazado',
    accepted_text: 'Tu responsable ha sido notificado. ¡Hasta pronto!',
    declined_text: 'Tu responsable ha sido notificado de tu indisponibilidad.',
    restaurant: 'Restaurante',
    date: 'Fecha',
    time: 'Hora',
    position: 'Puesto',
    not_specified: 'No especificado',
    your_shifts: 'Tus turnos esta semana',
    shift_count: 'turno(s) esta semana',
    powered_by: 'Powered by',
    day_0: 'domingo', day_1: 'lunes', day_2: 'martes', day_3: 'miércoles', day_4: 'jueves', day_5: 'viernes', day_6: 'sábado',
    month_0: 'enero', month_1: 'febrero', month_2: 'marzo', month_3: 'abril', month_4: 'mayo', month_5: 'junio',
    month_6: 'julio', month_7: 'agosto', month_8: 'septiembre', month_9: 'octubre', month_10: 'noviembre', month_11: 'diciembre',
  },
  it: {
    loading: 'Caricamento...',
    error: 'Errore',
    retry: 'Riprova',
    expired_title: 'Link scaduto',
    expired_text: 'Questo link di risposta è scaduto.',
    expired_contact: 'Per favore contatta direttamente il tuo responsabile.',
    invalid_link: 'Questo link non è valido o è già stato utilizzato.',
    load_error: 'Impossibile caricare i dettagli.',
    connection_error: 'Errore di connessione. Riprova.',
    submit_error: 'Impossibile inviare la tua risposta.',
    already_accepted: 'Già accettato',
    already_declined: 'Già rifiutato',
    already_text_accepted: 'Hai già accettato questo programma.',
    already_text_declined: 'Hai già rifiutato questo programma.',
    new_schedule: 'Nuovo programma',
    hello: 'Ciao',
    new_schedule_desc: ', ecco il tuo programma.',
    accept: 'Accetta programma',
    decline: 'Rifiuta programma',
    sending: 'Invio in corso...',
    accepted_title: 'Programma accettato!',
    declined_title: 'Programma rifiutato',
    accepted_text: 'Il tuo responsabile è stato avvisato. A presto!',
    declined_text: 'Il tuo responsabile è stato avvisato della tua indisponibilità.',
    restaurant: 'Ristorante',
    date: 'Data',
    time: 'Orario',
    position: 'Posizione',
    not_specified: 'Non specificato',
    your_shifts: 'I tuoi turni questa settimana',
    shift_count: 'turno/i questa settimana',
    powered_by: 'Powered by',
    day_0: 'domenica', day_1: 'lunedì', day_2: 'martedì', day_3: 'mercoledì', day_4: 'giovedì', day_5: 'venerdì', day_6: 'sabato',
    month_0: 'gennaio', month_1: 'febbraio', month_2: 'marzo', month_3: 'aprile', month_4: 'maggio', month_5: 'giugno',
    month_6: 'luglio', month_7: 'agosto', month_8: 'settembre', month_9: 'ottobre', month_10: 'novembre', month_11: 'dicembre',
  },
};

function detectLocale(): Locale {
  if (typeof navigator === 'undefined') return 'fr';
  const lang = (navigator.language || '').toLowerCase();
  if (lang.startsWith('nl')) return 'nl';
  if (lang.startsWith('en')) return 'en';
  if (lang.startsWith('es')) return 'es';
  if (lang.startsWith('it')) return 'it';
  if (lang.startsWith('fr')) return 'fr';
  return 'fr'; // default
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface WeeklyShift {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  position: string;
  status: string;
}

interface ShiftData {
  shift: {
    id: string;
    date: string;
    date_formatted: string;
    start_time: string;
    end_time: string;
    position: string;
    status: string;
  };
  weekly_shifts?: WeeklyShift[];
  employee_name: string;
  restaurant_name: string;
  already_responded: boolean;
  action: string | null;
  responded_at: string | null;
  expired: boolean;
}

type PageState = 'loading' | 'ready' | 'submitting' | 'success' | 'already_responded' | 'expired' | 'error';

// ─── Component ───────────────────────────────────────────────────────────────

export default function ShiftResponsePage() {
  const params = useParams();
  const token = params.token as string;

  const [locale, setLocale] = useState<Locale>('fr');
  const t = useMemo(() => TRANSLATIONS[locale], [locale]);

  const [state, setState] = useState<PageState>('loading');
  const [data, setData] = useState<ShiftData | null>(null);
  const [respondedAction, setRespondedAction] = useState<string | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    setLocale(detectLocale());
  }, []);

  const formatDate = useCallback((dateStr: string) => {
    try {
      const d = new Date(dateStr + 'T00:00:00');
      const day = t[`day_${d.getDay()}`];
      const month = t[`month_${d.getMonth()}`];
      return `${day} ${d.getDate()} ${month}`;
    } catch {
      return dateStr;
    }
  }, [t]);

  const fetchShiftData = useCallback(async () => {
    try {
      const res = await fetch(`${STAFF_API}/api/v1/shift-response/${token}`);
      if (res.status === 404) {
        setError(t.invalid_link);
        setState('error');
        return;
      }
      if (!res.ok) {
        setError(t.load_error);
        setState('error');
        return;
      }

      const json: ShiftData = await res.json();
      setData(json);

      if (json.expired) {
        setState('expired');
      } else if (json.already_responded) {
        setRespondedAction(json.action);
        setState('already_responded');
      } else {
        setState('ready');
      }
    } catch {
      setError(t.connection_error);
      setState('error');
    }
  }, [token, t]);

  useEffect(() => {
    fetchShiftData();
  }, [fetchShiftData]);

  const handleResponse = async (action: 'accepted' | 'declined') => {
    setState('submitting');
    try {
      const res = await fetch(`${STAFF_API}/api/v1/shift-response/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (res.status === 400) {
        const body = await res.json();
        if (body.error === 'ALREADY_RESPONDED') {
          setRespondedAction(body.action);
          setState('already_responded');
          return;
        }
      }

      if (res.status === 410) {
        setState('expired');
        return;
      }

      if (!res.ok) {
        setError(t.submit_error);
        setState('error');
        return;
      }

      setRespondedAction(action);
      setState('success');
    } catch {
      setError(t.connection_error);
      setState('error');
    }
  };

  const shifts = data?.weekly_shifts?.length ? data.weekly_shifts : data?.shift ? [data.shift] : [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f0f2ff] to-[#f8f9fc] flex flex-col items-center justify-center p-4">
      {/* ADA Logo */}
      <div className="mb-6">
        <img
          src="https://dxxtxdyrovawugvvrhah.supabase.co/storage/v1/object/public/ada/LOGO-ADA.png"
          alt="ADA"
          className="h-10 w-auto"
        />
      </div>

      {/* Language switcher */}
      <div className="flex gap-1 mb-4">
        {(['fr', 'nl', 'en', 'es', 'it'] as Locale[]).map((l) => (
          <button
            key={l}
            onClick={() => setLocale(l)}
            className={cn(
              'px-2 py-1 text-xs rounded-md font-medium transition-colors',
              locale === l
                ? 'bg-[#4d6aff] text-white'
                : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-200'
            )}
          >
            {l.toUpperCase()}
          </button>
        ))}
      </div>

      <Card className="w-full max-w-md shadow-lg border-0">
        {/* Loading */}
        {state === 'loading' && (
          <>
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-lg text-gray-500">{t.loading}</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center py-12">
              <Loader2 className="h-10 w-10 animate-spin text-[#4d6aff]" />
            </CardContent>
          </>
        )}

        {/* Error */}
        {state === 'error' && (
          <>
            <CardHeader className="text-center pb-2">
              <div className="flex justify-center mb-3">
                <div className="rounded-full bg-red-100 p-3">
                  <AlertTriangle className="h-8 w-8 text-red-500" />
                </div>
              </div>
              <CardTitle className="text-lg text-red-600">{t.error}</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 mb-6">{error}</p>
              <Button variant="outline" onClick={() => { setState('loading'); fetchShiftData(); }} className="w-full">
                {t.retry}
              </Button>
            </CardContent>
          </>
        )}

        {/* Expired */}
        {state === 'expired' && data && (
          <>
            <CardHeader className="text-center pb-2">
              <div className="flex justify-center mb-3">
                <div className="rounded-full bg-amber-100 p-3">
                  <AlertTriangle className="h-8 w-8 text-amber-500" />
                </div>
              </div>
              <CardTitle className="text-lg text-amber-600">{t.expired_title}</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 mb-2">{t.expired_text}</p>
              <p className="text-sm text-gray-500">{t.expired_contact}</p>
            </CardContent>
          </>
        )}

        {/* Already Responded */}
        {state === 'already_responded' && data && (
          <>
            <CardHeader className="text-center pb-2">
              <div className="flex justify-center mb-3">
                <div className={cn(
                  'rounded-full p-3',
                  respondedAction === 'accepted' ? 'bg-green-100' : 'bg-red-100'
                )}>
                  {respondedAction === 'accepted'
                    ? <CheckCircle2 className="h-8 w-8 text-green-500" />
                    : <XCircle className="h-8 w-8 text-red-500" />
                  }
                </div>
              </div>
              <CardTitle className="text-lg">
                {respondedAction === 'accepted' ? t.already_accepted : t.already_declined}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-gray-600 mb-4">
                {respondedAction === 'accepted' ? t.already_text_accepted : t.already_text_declined}
              </p>
              <ShiftsTable shifts={shifts} formatDate={formatDate} t={t} restaurantName={data.restaurant_name} />
            </CardContent>
          </>
        )}

        {/* Ready to respond */}
        {state === 'ready' && data && (
          <>
            <CardHeader className="text-center pb-2">
              <div className="flex justify-center mb-3">
                <div className="rounded-full bg-[#eef0ff] p-3">
                  <Calendar className="h-8 w-8 text-[#4d6aff]" />
                </div>
              </div>
              <CardTitle className="text-lg">{t.new_schedule}</CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                {t.hello} <span className="font-semibold text-gray-700">{data.employee_name}</span>{t.new_schedule_desc}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <ShiftsTable shifts={shifts} formatDate={formatDate} t={t} restaurantName={data.restaurant_name} />

              <div className="space-y-3 pt-2">
                <Button
                  className="w-full bg-[#4d6aff] hover:bg-[#3d57e0] text-white h-12 text-base font-semibold"
                  onClick={() => handleResponse('accepted')}
                >
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  {t.accept}
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 h-12 text-base font-semibold"
                  onClick={() => handleResponse('declined')}
                >
                  <XCircle className="w-5 h-5 mr-2" />
                  {t.decline}
                </Button>
              </div>
            </CardContent>
          </>
        )}

        {/* Submitting */}
        {state === 'submitting' && (
          <>
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-lg text-gray-500">{t.sending}</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center py-12">
              <Loader2 className="h-10 w-10 animate-spin text-[#4d6aff]" />
            </CardContent>
          </>
        )}

        {/* Success */}
        {state === 'success' && data && (
          <>
            <CardHeader className="text-center pb-2">
              <div className="flex justify-center mb-3">
                <div className={cn(
                  'rounded-full p-3',
                  respondedAction === 'accepted' ? 'bg-green-100' : 'bg-red-100'
                )}>
                  {respondedAction === 'accepted'
                    ? <CheckCircle2 className="h-8 w-8 text-green-500" />
                    : <XCircle className="h-8 w-8 text-red-500" />
                  }
                </div>
              </div>
              <CardTitle className="text-lg">
                {respondedAction === 'accepted' ? t.accepted_title : t.declined_title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-gray-600 mb-4">
                {respondedAction === 'accepted' ? t.accepted_text : t.declined_text}
              </p>
              <ShiftsTable shifts={shifts} formatDate={formatDate} t={t} restaurantName={data.restaurant_name} />
            </CardContent>
          </>
        )}
      </Card>

      {/* Footer */}
      <p className="text-xs text-gray-400 mt-6">
        {t.powered_by} <strong>ADA</strong> — Planning System
      </p>
    </div>
  );
}

// ─── Shifts Table ────────────────────────────────────────────────────────────

interface ShiftsTableProps {
  shifts: { date: string; start_time: string; end_time: string; position: string }[];
  formatDate: (d: string) => string;
  t: Record<string, string>;
  restaurantName: string;
}

function ShiftsTable({ shifts, formatDate, t, restaurantName }: ShiftsTableProps) {
  return (
    <div className="space-y-3">
      {/* Restaurant */}
      <div className="flex items-center gap-3 px-1">
        <Building2 className="h-4 w-4 text-gray-400 shrink-0" />
        <div>
          <p className="text-xs text-gray-500">{t.restaurant}</p>
          <p className="text-sm font-semibold text-gray-900">{restaurantName}</p>
        </div>
      </div>

      {/* Shifts list */}
      <div className="bg-[#f8f9ff] border border-[#e2e6ff] rounded-lg overflow-hidden">
        <div className="px-4 py-2 border-b border-[#e2e6ff] bg-[#eef0ff]">
          <p className="text-xs font-semibold text-[#4d6aff] uppercase tracking-wide">
            {t.your_shifts} — {shifts.length} {t.shift_count}
          </p>
        </div>
        <div className="divide-y divide-[#eef0ff]">
          {shifts.map((s, i) => (
            <div key={i} className="px-4 py-3 flex items-center gap-3">
              <div className="flex items-center gap-2 min-w-[130px]">
                <Calendar className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                <span className="text-sm font-semibold text-gray-900 capitalize">{formatDate(s.date)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                <span className="text-sm text-gray-700">{s.start_time} – {s.end_time}</span>
              </div>
              {s.position && (
                <div className="flex items-center gap-1.5 ml-auto">
                  <User className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                  <span className="text-xs text-gray-500">{s.position}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
