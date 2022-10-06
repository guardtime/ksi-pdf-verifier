import { SidebarView } from 'pdfjs-dist/lib/web/pdf_sidebar';

export const KSI_SIDEBAR_TAB = 5;

export function _switchView(view, forceOpen = false) {
  const isViewChanged = (view !== this.active);
  let shouldForceRendering = false;
  switch (view) {
    case SidebarView.NONE:
      if (this.isOpen) {
        this.close();
        return true; // Closing will trigger rendering and dispatch the event.
      }
      return false;
    case SidebarView.THUMBS:
      if (this.isOpen && isViewChanged) {
        shouldForceRendering = true;
      }
      break;
    case SidebarView.OUTLINE:
      if (this.outlineButton.disabled) {
        return false;
      }
      break;
    case SidebarView.ATTACHMENTS:
      if (this.attachmentsButton.disabled) {
        return false;
      }
      break;
    case KSI_SIDEBAR_TAB:
      if (this.ksiSignaturesButton.disabled) {
        return false;
      }
      break;
    default:
      console.error(`PDFSidebar._switchView: "${view}" is not a valid view.`);
      return false;
  }
  // Update the active view *after* it has been validated above,
  // in order to prevent setting it to an invalid state.
  this.active = view;

  // Update the CSS classes, for all buttons...
  this.thumbnailButton.classList.toggle('toggled',
    view === SidebarView.THUMBS);
  this.outlineButton.classList.toggle('toggled',
    view === SidebarView.OUTLINE);
  this.attachmentsButton.classList.toggle('toggled',
    view === SidebarView.ATTACHMENTS);
  this.ksiSignaturesButton.classList.toggle('toggled',
    view === KSI_SIDEBAR_TAB);
  // ... and for all views.
  this.thumbnailView.classList.toggle('hidden', view !== SidebarView.THUMBS);
  this.outlineView.classList.toggle('hidden', view !== SidebarView.OUTLINE);
  this.attachmentsView.classList.toggle('hidden',
    view !== SidebarView.ATTACHMENTS);
  this.ksiSignaturesView.classList.toggle('hidden',
    view !== KSI_SIDEBAR_TAB);

  if (forceOpen && !this.isOpen) {
    this.open();
    return true; // Opening will trigger rendering and dispatch the event.
  }
  if (shouldForceRendering) {
    this._updateThumbnailViewer();
    this._forceRendering();
  }
  if (isViewChanged) {
    this._dispatchEvent();
  }
  this._hideUINotification(this.active);
  return isViewChanged;
}
