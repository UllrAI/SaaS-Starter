"use client";

import { useCallback, useRef, useEffect } from "react";

/**
 * Hook for enhanced focus management in dialogs and forms
 */
export function useFocusManagement() {
  const lastFocusedElement = useRef<HTMLElement | null>(null);

  // Store the currently focused element before opening a dialog
  const storeFocus = useCallback(() => {
    lastFocusedElement.current = document.activeElement as HTMLElement;
  }, []);

  // Restore focus to the previously focused element
  const restoreFocus = useCallback(() => {
    if (
      lastFocusedElement.current &&
      typeof lastFocusedElement.current.focus === "function"
    ) {
      // Small delay to ensure the dialog is fully closed
      setTimeout(() => {
        lastFocusedElement.current?.focus();
      }, 10);
    }
  }, []);

  // Focus the first interactive element in a container
  const focusFirstElement = useCallback((container: HTMLElement | null) => {
    if (!container) return;

    const focusableElements = container.querySelectorAll(
      'input:not([disabled]), textarea:not([disabled]), select:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled]), [href]:not([disabled])',
    );

    const firstElement = focusableElements[0] as HTMLElement;
    if (firstElement) {
      // Small delay to ensure the element is rendered
      setTimeout(() => {
        firstElement.focus();
      }, 10);
    }
  }, []);

  // Focus the first input field in a form
  const focusFirstInput = useCallback((container: HTMLElement | null) => {
    if (!container) return;

    const firstInput = container.querySelector(
      'input:not([disabled]):not([type="hidden"]), textarea:not([disabled]), select:not([disabled])',
    ) as HTMLElement;

    if (firstInput) {
      setTimeout(() => {
        firstInput.focus();
      }, 10);
    }
  }, []);

  // Focus an element with error state
  const focusErrorField = useCallback(
    (fieldName: string, container?: HTMLElement | null) => {
      const searchContainer = container || document;
      const errorField = searchContainer.querySelector(
        `[name="${fieldName}"], #${fieldName}, [data-field="${fieldName}"]`,
      ) as HTMLElement;

      if (errorField) {
        setTimeout(() => {
          errorField.focus();
          // Scroll into view if needed
          errorField.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 10);
      }
    },
    [],
  );

  // Create a focus trap within a container
  const createFocusTrap = useCallback((container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'input:not([disabled]), textarea:not([disabled]), select:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled]), [href]:not([disabled])',
    );

    if (focusableElements.length === 0) return () => {};

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[
      focusableElements.length - 1
    ] as HTMLElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        if (e.shiftKey) {
          // Shift + Tab: focus previous element
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          // Tab: focus next element
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    container.addEventListener("keydown", handleKeyDown);

    // Return cleanup function
    return () => {
      container.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Handle dialog open with focus management
  const handleDialogOpen = useCallback(
    (dialogContainer?: HTMLElement | null, focusFirst = true) => {
      storeFocus();
      if (focusFirst && dialogContainer) {
        focusFirstInput(dialogContainer);
      }
    },
    [storeFocus, focusFirstInput],
  );

  // Handle dialog close with focus restoration
  const handleDialogClose = useCallback(
    (shouldRestore = true) => {
      if (shouldRestore) {
        restoreFocus();
      }
    },
    [restoreFocus],
  );

  return {
    storeFocus,
    restoreFocus,
    focusFirstElement,
    focusFirstInput,
    focusErrorField,
    createFocusTrap,
    handleDialogOpen,
    handleDialogClose,
  };
}

/**
 * Hook for managing focus within forms with validation
 */
export function useFormFocusManagement<T extends Record<string, any>>(
  errors?: any,
) {
  const { focusErrorField, focusFirstInput } = useFocusManagement();
  const formRef = useRef<HTMLFormElement>(null);

  // Focus the first field with an error
  const focusFirstError = useCallback(() => {
    if (!errors || !formRef.current) return;

    const errorFields = Object.keys(errors);
    if (errorFields.length > 0) {
      focusErrorField(errorFields[0], formRef.current);
    }
  }, [errors, focusErrorField]);

  // Focus the first input when form is mounted
  const focusFirstField = useCallback(() => {
    if (formRef.current) {
      focusFirstInput(formRef.current);
    }
  }, [focusFirstInput]);

  // Auto-focus first error when errors change
  useEffect(() => {
    if (errors && Object.keys(errors).length > 0) {
      focusFirstError();
    }
  }, [errors, focusFirstError]);

  return {
    formRef,
    focusFirstError,
    focusFirstField,
  };
}
