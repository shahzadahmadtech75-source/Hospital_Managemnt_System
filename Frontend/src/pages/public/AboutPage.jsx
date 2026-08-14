import React from 'react';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import {
  BuildingOfficeIcon,
  HeartIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  BoltIcon,
  ClockIcon,
  UserGroupIcon,
  AcademicCapIcon,
  TrophyIcon,
  MapPinIcon,
  PhoneIcon,
  ChatBubbleBottomCenterTextIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';

// Replace with real content / API data — these are placeholders to wire up
const values = [
  { icon: HeartIcon, title: 'Compassion First', desc: 'Every decision starts with what is best for the person in front of us, not just the chart.' },
  { icon: ShieldCheckIcon, title: 'Uncompromising Safety', desc: 'Rigorous protocols and continuous training keep every procedure held to the highest standard.' },
  { icon: CheckCircleIcon, title: 'Clinical Excellence', desc: 'Our specialists train at leading institutions and keep pace with the latest evidence-based care.' },
  { icon: BoltIcon, title: 'Always Advancing', desc: 'We invest in modern diagnostic and treatment technology so care keeps improving, not standing still.' },
];

const stats = [
  { icon: ClockIcon, value: '32+', label: 'Years of Service' },
  { icon: UserGroupIcon, value: '180K+', label: 'Patients Cared For' },
  { icon: AcademicCapIcon, value: '240+', label: 'Specialist Physicians' },
  { icon: TrophyIcon, value: '98%', label: 'Patient Satisfaction' },
];

const milestones = [
  { year: '1992', text: 'Opened as a 40-bed community hospital with a single mission: care close to home.' },
  { year: '2004', text: 'Launched our Cardiac & Vascular Institute, one of the first in the region.' },
  { year: '2015', text: 'Achieved national accreditation for surgical excellence and patient safety.' },
  { year: '2023', text: 'Opened a new emergency and trauma wing, doubling critical-care capacity.' },
];

const leaders = [
  { name: 'Dr. Amara Chen', role: 'Chief of Medicine', img: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=400&auto=format&fit=crop' },
  { name: 'Dr. Rajiv Menon', role: 'Head of Cardiology', img: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=400&auto=format&fit=crop' },
  { name: 'Dr. Sarah Whitfield', role: 'Director of Surgery', img: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?q=80&w=400&auto=format&fit=crop' },
];

// Small animated ECG line — the page's one signature motif, used sparingly
const PulseLine = ({ className = '' }) => (
  <svg viewBox="0 0 200 40" className={className} fill="none" preserveAspectRatio="none">
    <polyline
      points="0,20 40,20 55,5 68,35 82,20 200,20"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="pulse-path"
    />
  </svg>
);

const AboutPage = () => {
  return (
    <div className="bg-white text-slate-800">
      <Header/>
      <style>{`
        .pulse-path {
          stroke-dasharray: 220;
          stroke-dashoffset: 220;
          animation: pulse-draw 3.5s ease-in-out infinite;
        }
        @keyframes pulse-draw {
          0% { stroke-dashoffset: 220; }
          40% { stroke-dashoffset: 0; }
          60% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: -220; }
        }
        @media (prefers-reduced-motion: reduce) {
          .pulse-path { animation: none; stroke-dashoffset: 0; }
        }
      `}</style>

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 via-white to-white">
        <div className="max-w-6xl mx-auto px-6 lg:px-8 pt-20 pb-16 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 text-blue-600 font-semibold text-sm tracking-wide uppercase mb-4">
              <BuildingOfficeIcon className="w-4 h-4" />
              About City Care Hospital
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 leading-tight mb-4">
              Care that treats the <span className="text-blue-600">person</span>, not just the diagnosis
            </h1>
            <PulseLine className="w-32 h-8 text-blue-500 mb-5" />
            <p className="text-lg text-slate-500 leading-relaxed mb-8 max-w-lg">
              For over three decades, we've combined advanced medicine with genuine
              human care — because healing works best when people feel seen, heard,
              and safe.
            </p>
            <div className="flex flex-wrap gap-4">
              <button className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
                Book an Appointment <ArrowRightIcon className="w-4 h-4" />
              </button>
              <button className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 hover:border-blue-300 text-slate-700 font-medium rounded-lg transition-colors">
                Meet Our Doctors
              </button>
            </div>
          </div>

          <div className="relative">
            <div className="rounded-2xl overflow-hidden shadow-xl shadow-blue-100">
              <img
                src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=900&auto=format&fit=crop"
                alt="Physician consulting with a patient"
                className="w-full h-[420px] object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -left-6 bg-white rounded-xl shadow-lg border border-blue-50 px-5 py-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                <ShieldCheckIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Nationally Accredited</p>
                <p className="text-xs text-slate-400">Joint Commission Certified</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS BAND */}
      <section className="bg-blue-600">
        <div className="max-w-6xl mx-auto px-6 lg:px-8 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="text-center text-white">
                <Icon className="w-6 h-6 mx-auto mb-2 text-blue-200" />
                <p className="text-3xl font-bold">{s.value}</p>
                <p className="text-sm text-blue-100 mt-1">{s.label}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* MISSION / VALUES */}
      <section className="max-w-6xl mx-auto px-6 lg:px-8 py-20">
        <div className="max-w-2xl mb-12">
          <p className="text-blue-600 font-semibold text-sm uppercase tracking-wide mb-2">What guides us</p>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Four commitments behind every patient interaction
          </h2>
          <p className="text-slate-500 leading-relaxed">
            These aren't values on a poster in the lobby — they're how we train staff,
            design our units, and measure ourselves every day.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {values.map((v, i) => {
            const Icon = v.icon;
            return (
              <div
                key={i}
                className="group bg-white rounded-2xl border border-slate-200 p-6 transition-all duration-300 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-100 hover:-translate-y-0.5"
              >
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4 border border-blue-100 transition-colors duration-300 group-hover:bg-blue-600 group-hover:border-blue-600">
                  <Icon className="w-6 h-6 text-blue-500 transition-colors duration-300 group-hover:text-white" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{v.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{v.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* OUR STORY / TIMELINE */}
      <section className="bg-slate-50 border-y border-slate-100">
        <div className="max-w-6xl mx-auto px-6 lg:px-8 py-20 grid md:grid-cols-2 gap-16">
          <div>
            <p className="text-blue-600 font-semibold text-sm uppercase tracking-wide mb-2">Our story</p>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-5">
              Three decades of growing with our community
            </h2>
            <p className="text-slate-500 leading-relaxed mb-6">
              We started as a small community hospital with 40 beds and a simple idea:
              world-class care shouldn't require leaving home to find it. Every expansion
              since has followed the same principle — grow where our patients need us most.
            </p>
            <div className="flex items-center gap-3 text-slate-500 text-sm">
              <MapPinIcon className="w-4 h-4 text-blue-500" />
              4 campuses across the region
            </div>
          </div>
          <div className="relative pl-8 border-l-2 border-blue-100 space-y-10">
            {milestones.map((m, i) => (
              <div key={i} className="relative">
                <span className="absolute -left-[38px] top-0 w-4 h-4 rounded-full bg-blue-600 ring-4 ring-blue-50" />
                <p className="text-lg font-bold text-blue-600 mb-1">{m.year}</p>
                <p className="text-slate-600 leading-relaxed">{m.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LEADERSHIP */}
      <section className="max-w-6xl mx-auto px-6 lg:px-8 py-20">
        <div className="max-w-2xl mb-12">
          <p className="text-blue-600 font-semibold text-sm uppercase tracking-wide mb-2">Leadership</p>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            The physicians setting our clinical standard
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {leaders.map((l, i) => (
            <div
              key={i}
              className="group bg-white rounded-2xl border border-slate-200 overflow-hidden transition-all duration-300 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-100 hover:-translate-y-0.5"
            >
              <div className="h-64 overflow-hidden">
                <img src={l.img} alt={l.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              </div>
              <div className="p-5">
                <h3 className="font-semibold text-slate-900">{l.name}</h3>
                <p className="text-sm text-blue-500">{l.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONIAL */}
      <section className="bg-blue-50/60">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 py-20 text-center">
          <ChatBubbleBottomCenterTextIcon className="w-8 h-8 text-blue-300 mx-auto mb-6" />
          <p className="text-2xl md:text-3xl font-semibold text-slate-800 leading-snug mb-6">
            "From the first phone call to the follow-up visit, I never once felt like
            a number. That's rare, and it's why we trust them with our family's care."
          </p>
          <div className="flex items-center justify-center gap-1 text-amber-400 mb-2">
            {[...Array(5)].map((_, i) => (
              <StarIcon key={i} className="w-4 h-4" />
            ))}
          </div>
          <p className="text-sm text-slate-500">Maria T. — Patient since 2018</p>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 lg:px-8 py-20">
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl px-8 md:px-16 py-14 text-center relative overflow-hidden">
          <PulseLine className="w-40 h-10 text-blue-400/40 mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to experience care built around you?
          </h2>
          <p className="text-blue-100 mb-8 max-w-xl mx-auto">
            Our team is ready to help — whether it's a routine check-up or a
            specialist consultation.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button className="inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-blue-50 text-blue-700 font-semibold rounded-lg transition-colors">
              Book an Appointment <ArrowRightIcon className="w-4 h-4" />
            </button>
            <button className="inline-flex items-center gap-2 px-6 py-3 border border-blue-300 hover:bg-blue-500/30 text-white font-medium rounded-lg transition-colors">
              <PhoneIcon className="w-4 h-4" /> Call (555) 010-2345
            </button>
          </div>
        </div>
      </section>
      <Footer/>
    </div>
  );
};

export default AboutPage;