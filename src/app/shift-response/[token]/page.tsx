'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import {
  Calendar,
  Clock,
  MapPin,
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
  employee_name: string;
  restaurant_name: string;
  already_responded: boolean;
  action: string | null;
  responded_at: string | null;
  expired: boolean;
}

type PageState = 'loading' | 'ready' | 'submitting' | 'success' | 'already_responded' | 'expired' | 'error';

export default function ShiftResponsePage() {
  const params = useParams();
  const token = params.token as string;

  const [state, setState] = useState<PageState>('loading');
  const [data, setData] = useState<ShiftData | null>(null);
  const [respondedAction, setRespondedAction] = useState<string | null>(null);
  const [error, setError] = useState<string>('');

  const fetchShiftData = useCallback(async () => {
    try {
      const res = await fetch(`${STAFF_API}/api/v1/shift-response/${token}`);
      if (res.status === 404) {
        setError("Ce lien n'est pas valide ou a déjà été utilisé.");
        setState('error');
        return;
      }
      if (!res.ok) {
        setError("Impossible de charger les détails du shift.");
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
      setError("Erreur de connexion. Veuillez réessayer.");
      setState('error');
    }
  }, [token]);

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
        setError("Impossible de soumettre votre réponse. Veuillez réessayer.");
        setState('error');
        return;
      }

      setRespondedAction(action);
      setState('success');
    } catch {
      setError("Erreur de connexion. Veuillez réessayer.");
      setState('error');
    }
  };

  const formatDutchDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr + 'T00:00:00');
      const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
      const months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
      return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    } catch {
      return dateStr;
    }
  };

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

      <Card className="w-full max-w-md shadow-lg border-0">
        {/* Loading */}
        {state === 'loading' && (
          <>
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-lg text-gray-500">Chargement...</CardTitle>
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
              <CardTitle className="text-lg text-red-600">Erreur</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 mb-6">{error}</p>
              <Button variant="outline" onClick={() => { setState('loading'); fetchShiftData(); }} className="w-full">
                Réessayer
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
              <CardTitle className="text-lg text-amber-600">Lien expiré</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 mb-2">
                Ce lien de réponse a expiré.
              </p>
              <p className="text-sm text-gray-500">
                Veuillez contacter votre responsable directement pour confirmer votre disponibilité.
              </p>
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
                {respondedAction === 'accepted' ? 'Déjà accepté' : 'Déjà refusé'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-gray-600 mb-4">
                Vous avez déjà {respondedAction === 'accepted' ? 'accepté' : 'refusé'} ce shift.
              </p>
              <ShiftDetails data={data} formatDate={formatDutchDate} />
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
              <CardTitle className="text-lg">Nouveau shift assigné</CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                Bonjour <span className="font-semibold text-gray-700">{data.employee_name}</span>, vous avez un nouveau shift.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <ShiftDetails data={data} formatDate={formatDutchDate} />

              <div className="space-y-3 pt-2">
                <Button
                  className="w-full bg-[#4d6aff] hover:bg-[#3d57e0] text-white h-12 text-base font-semibold"
                  onClick={() => handleResponse('accepted')}
                >
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  Accepter le shift
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 h-12 text-base font-semibold"
                  onClick={() => handleResponse('declined')}
                >
                  <XCircle className="w-5 h-5 mr-2" />
                  Refuser le shift
                </Button>
              </div>
            </CardContent>
          </>
        )}

        {/* Submitting */}
        {state === 'submitting' && (
          <>
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-lg text-gray-500">Envoi en cours...</CardTitle>
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
                {respondedAction === 'accepted' ? 'Shift accepté !' : 'Shift refusé'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-gray-600 mb-4">
                {respondedAction === 'accepted'
                  ? 'Votre responsable a été notifié. À bientôt !'
                  : 'Votre responsable a été notifié de votre indisponibilité.'}
              </p>
              <ShiftDetails data={data} formatDate={formatDutchDate} />
            </CardContent>
          </>
        )}
      </Card>

      {/* Footer */}
      <p className="text-xs text-gray-400 mt-6">
        Powered by <strong>ADA</strong> — Planning System
      </p>
    </div>
  );
}

function ShiftDetails({ data, formatDate }: { data: ShiftData; formatDate: (d: string) => string }) {
  return (
    <div className="bg-[#f8f9ff] border border-[#e2e6ff] rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Building2 className="h-4 w-4 text-gray-400 shrink-0" />
        <div>
          <p className="text-xs text-gray-500">Restaurant</p>
          <p className="text-sm font-semibold text-gray-900">{data.restaurant_name}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Calendar className="h-4 w-4 text-gray-400 shrink-0" />
        <div>
          <p className="text-xs text-gray-500">Date</p>
          <p className="text-sm font-semibold text-gray-900">{formatDate(data.shift.date)}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Clock className="h-4 w-4 text-gray-400 shrink-0" />
        <div>
          <p className="text-xs text-gray-500">Horaire</p>
          <p className="text-sm font-semibold text-gray-900">{data.shift.start_time} – {data.shift.end_time}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <User className="h-4 w-4 text-gray-400 shrink-0" />
        <div>
          <p className="text-xs text-gray-500">Poste</p>
          <p className="text-sm font-semibold text-gray-900">{data.shift.position || 'Non spécifié'}</p>
        </div>
      </div>
    </div>
  );
}
