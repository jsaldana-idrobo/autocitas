import React from "react";
import { BookingForm } from "./BookingForm";
import { LoadingCard } from "./LoadingCard";
import { ManageAppointmentModal } from "./ManageAppointmentModal";
import { useBookingState } from "./useBookingState";

export function BookingApp({ slug }: Readonly<{ slug: string }>) {
  const {
    loading,
    error,
    business,
    serviceId,
    date,
    slots,
    selectedSlot,
    resourceId,
    customerName,
    customerPhone,
    confirmation,
    manageOpen,
    manageSearchPhone,
    manageResults,
    manageSelected,
    manageName,
    managePhone,
    manageStartTime,
    manageMessage,
    canSubmit,
    canSearch,
    canUpdate,
    canCancel,
    searchOpacityClass,
    updateOpacityClass,
    cancelOpacityClass,
    timezone,
    service,
    availableResources,
    setCustomerName,
    setCustomerPhone,
    setSelectedSlot,
    setManageSearchPhone,
    setManageSelected,
    setManageName,
    setManagePhone,
    setManageStartTime,
    setManageOpen,
    handleBooking,
    handleSearchAppointments,
    handleUpdateAppointment,
    handleCancelAppointment,
    handleServiceChange,
    handleDateChange,
    handleResourceChange,
    handleOpenManage,
    fireAndForget
  } = useBookingState(slug);

  if (loading && !business) {
    return <LoadingCard />;
  }

  if (!business) {
    return <div className="card p-6">No se encontro el negocio.</div>;
  }

  if (business.services.length === 0) {
    return <div className="card p-6">Este negocio aun no tiene servicios activos.</div>;
  }

  return (
    <>
      <BookingForm
        business={business}
        serviceId={serviceId}
        date={date}
        resourceId={resourceId}
        availableResources={availableResources}
        slots={slots}
        selectedSlot={selectedSlot}
        customerName={customerName}
        customerPhone={customerPhone}
        error={error}
        confirmation={confirmation}
        loading={loading}
        canSubmit={canSubmit}
        service={service}
        timezone={timezone}
        onServiceChange={handleServiceChange}
        onDateChange={handleDateChange}
        onResourceChange={handleResourceChange}
        onSlotSelect={setSelectedSlot}
        onBooking={() => fireAndForget(handleBooking())}
        onCustomerNameChange={setCustomerName}
        onCustomerPhoneChange={setCustomerPhone}
        onOpenManage={handleOpenManage}
      />

      <ManageAppointmentModal
        open={manageOpen}
        business={business}
        timezone={timezone}
        manageSearchPhone={manageSearchPhone}
        setManageSearchPhone={setManageSearchPhone}
        manageResults={manageResults}
        manageSelected={manageSelected}
        setManageSelected={setManageSelected}
        manageName={manageName}
        setManageName={setManageName}
        managePhone={managePhone}
        setManagePhone={setManagePhone}
        manageStartTime={manageStartTime}
        setManageStartTime={setManageStartTime}
        manageMessage={manageMessage}
        onClose={() => setManageOpen(false)}
        onSearch={handleSearchAppointments}
        onUpdate={handleUpdateAppointment}
        onCancel={handleCancelAppointment}
        canSearch={canSearch}
        canUpdate={canUpdate}
        canCancel={canCancel}
        searchOpacityClass={searchOpacityClass}
        updateOpacityClass={updateOpacityClass}
        cancelOpacityClass={cancelOpacityClass}
        fireAndForget={fireAndForget}
      />
    </>
  );
}
