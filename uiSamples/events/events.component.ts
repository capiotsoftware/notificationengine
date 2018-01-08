import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormGroup, FormBuilder, FormControl, Validators } from '@angular/forms';
import { NgbModal, NgbModalOptions, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { concat } from 'rxjs/observable/concat';
import { Observable } from 'rxjs/Observable';


@Component({
	selector: 'app-events',
	templateUrl: './events.component.html',
	styleUrls: ['./events.component.css']
})
export class EventsComponent implements OnInit {


	private URL_Subscription = "http://localhost:10010/ne/subscribe";
	private URL_Template = "http://localhost:10010/ne/template";
	private URL = "http://localhost:10010/ne/event";

	private event: any = {};
	events: Array<any> = [];
	form: FormGroup;
	private recipientForm: FormGroup;
	private eventForm: FormGroup;
	load_events: boolean = true;
	private load_subscriptions: boolean = true;
	private load_templates: boolean = true;
	private load_save: boolean = false;
	private load_delete: boolean = false;
	private newEvent: boolean = false;
	private subscriptions: Array<any> = [];
	private templates: Array<any> = [];
	private templateList: Array<any> = [];
	private addEditModal: NgbModalRef;
	private deleteModal: NgbModalRef;
	private message: string;
	private disableSaveBtn: boolean = false;
	private disableCancelBtn: boolean = false;
	private cancelSure: boolean = false;

	constructor(
		private fb: FormBuilder,
		private http: HttpClient,
		private modalService: NgbModal) {
		this.form = fb.group({
			'name': [null, [Validators.required, Validators.pattern(/[\w-\s]+/)]]
		});
		this.recipientForm = this.fb.group({
			'name': [null, [Validators.required, Validators.pattern(/[\w\s]+/)]],
			'destination': [null, Validators.required],
			'type': ['', Validators.required]
		});
		this.eventForm = fb.group({
			'name': [null, [Validators.required, Validators.pattern(/[\w-\s]+/)]],
			'description': [null, [Validators.required, Validators.pattern(/[\w-\s]+/)]],
			'priority': ['2', [Validators.required, Validators.pattern(/(1|2)/)]],
			'templateIDs': [[], Validators.required],
			'defaultRecipientList': [[]],
			'sms': fb.group({
				'name': [null, [Validators.required, Validators.pattern(/[\w\s]+/)]],
				'number': [null, [Validators.required, Validators.pattern(/^(\+|)[0-9]+$/)]]
			}),
			'email': fb.group({
				'name': [null, [Validators.required, Validators.pattern(/[\w\s]+/)]],
				'address': [null, [Validators.required, Validators.pattern(/^[\w\.]+@[\w]{2,}(\.[\w]{2,})+$/)]]
			}),
			'_enableSMS': false,
			'_enableEmail': false,
			'_templateName': ['', Validators.pattern(/[\w-\s]+/)]
		});
	}

	ngOnInit() {
		this.eventForm.get('sms').disable();
		this.eventForm.get('email').disable();
		this.eventForm.get('_enableSMS').valueChanges.subscribe(
			(value: boolean) => {
				if (value) {
					this.eventForm.get('sms').enable();
				} else {
					this.eventForm.get('sms').disable();
				}
			}
		);
		this.eventForm.get('_enableEmail').valueChanges.subscribe(
			(value: boolean) => {
				if (value) {
					this.eventForm.get('email').enable();
				} else {
					this.eventForm.get('email').disable();
				}
			}
		);
		this.recipientForm.get('type').valueChanges.subscribe(
			(value) => {
				this.recipientForm.get('destination').clearValidators();
				if (value == 'sms') {
					this.recipientForm.get('destination').setValidators([Validators.required, Validators.pattern(/^(\+|)[0-9]+$/)]);
				} else {
					this.recipientForm.get('destination').setValidators([Validators.required, Validators.pattern(/^[\w\.]+@[\w]{2,}(\.[\w]{2,})+$/)]);
				}
				this.recipientForm.get('destination').updateValueAndValidity();
			}
		);
		this.get(0, null);
	}

	populateFormWithData() {
		this.eventForm.get('name').patchValue(this.event.name);
		this.eventForm.get('description').patchValue(this.event.description);
		this.eventForm.get('priority').patchValue(this.event.priority + '');
		this.eventForm.get('templateIDs').patchValue(this.event.templateIDs);
		this.eventForm.get('defaultRecipientList').patchValue(this.event.defaultRecipientList);
		if (this.event.sms) {
			this.eventForm.get('sms').patchValue(this.event.sms);
			this.eventForm.get('_enableSMS').patchValue(true);
		}
		if (this.event.email) {
			this.eventForm.get('email').patchValue(this.event.email);
			this.eventForm.get('_enableEmail').patchValue(true);
		}
		this.getTemplates(null, this.event.templateIDs).subscribe(
			(res) => {
				this.templates = res;
				this.load_templates = false;
			}
		);
	}

	searchTemplate(event) {
		var value = event.target.value;
		if(value && value.trim()!=''){
			this.getTemplates(value, null).subscribe(
				(res: any) => {
					this.templateList = res;
				}
			);
		}
	}

	get(_page, _filter) {
		this.event = null;
		this.events = [];
		this.load_events = true;
		let filter = {};
		if (_filter && _filter.name) filter["name"] = "/" + _filter.name + "/";
		this.http.get(this.URL + '?filter=' + JSON.stringify(filter) + '&page=' + _page).subscribe(
			(res: any) => {
				this.events = res.filter((e, i, a) => {
					if (e.email && !e.email.name) {
						delete e.email;
					}
					if (e.sms && !e.sms.name) {
						delete e.sms;
					}
					return e;
				});
				this.load_events = false;
			}
		);
	}
	getTemplates(name, id): Observable<any> {
		var filter = {};
		if (name) {
			filter['name'] = '/' + name + '/'
		}
		if (id) {
			filter['_id'] = id
		}
		return this.http.get(this.URL_Template + '?filter=' + JSON.stringify(filter) + '&select=name');
	}

	viewEvent(_modalId, index) {
		this.event = this.events[index];
		this.load_subscriptions = true;
		this.load_templates = true;
		this.subscriptions = [];
		this.templates = [];
		this.http.get(this.URL_Subscription + '?filter=' + JSON.stringify({ eventID: this.event._id })).subscribe(
			(res: any) => {
				this.subscriptions = res;
				this.load_subscriptions = false;
			}
		);
		this.getTemplates(null, this.event.templateIDs).subscribe(
			(res: any) => {
				this.templates = res;
				this.load_templates = false;
			}
		);
		this.modalService.open(_modalId, { windowClass: 'large-modal' }).result.then((result) => {
			console.log(result);
		}, (reason) => {
			console.log(reason);
		});
	}
	openModal(_modalId, newEvent, index?) {
		this.message = null;
		this.disableCancelBtn = false;
		this.disableSaveBtn = false;
		this.eventForm.reset();
		this.templates = [];
		this.templateList = [];
		if (newEvent) {
			this.load_templates = false;
			this.eventForm.get('defaultRecipientList').patchValue([]);
			this.eventForm.get('templateIDs').patchValue([]);
			this.eventForm.get('priority').patchValue('2');
			this.newEvent = true;
		} else {
			this.load_templates = true;
			this.event = this.events[index];
			this.newEvent = false;
			this.http.get(this.URL+'/'+this.events[index]._id).subscribe(
				res=>{
					this.event = res;
					this.populateFormWithData();
				},
				err=>{
					console.log(err);
				}
			);
		}
		var options: NgbModalOptions = {
			windowClass: 'large-modal',
			beforeDismiss:()=>{
				return false;
			}
		};
		this.addEditModal = this.modalService.open(_modalId, options);
	}

	addTemplate(value) {
		if(this.templates.filter((e)=>{
			if(e._id==value._id){
				return e;
			}
		}).length>0){
			return;
		}
		this.templates.push(value);
		var values = this.eventForm.get('templateIDs').value;
		values.push(value._id);
		this.eventForm.get('templateIDs').patchValue(values);
	}

	save() {
		this.disableSaveBtn = true;
		this.disableCancelBtn = true;
		this.load_save = true;
		var value = this.eventForm.value;
		value.priority = +value.priority;
		for (let c in value) {
			if (c.indexOf('_') == 0) {
				delete value[c];
			}
		}
		let observable: Observable<any>;
		if (this.newEvent) {
			observable = this.http.post(this.URL, value);
		} else {
			if (!this.eventForm.get('_enableEmail').value) {
				value.email = null;
			}
			if (!this.eventForm.get('_enableSMS').value) {
				value.sms = null;
			}
			observable = this.http.put(this.URL + '/' + this.event._id, value);
		}
		observable.subscribe(
			(res) => {
				this.load_save = false;
				this.message = 'Event Saved Successfully';
				this.addEditModal.close()
				this.disableCancelBtn = false;
				this.disableSaveBtn = false;
				this.get(0, null);
			},
			(err) => {
				this.load_save = false;
				this.disableCancelBtn = false;
				this.disableSaveBtn = false;
				if(err.status==400){
					this.message = err.error.message;
				}else{
					this.message = 'Unable to save';
				}
			}
		)
	}
	cancel() {
		if (this.eventForm.touched) {
			this.message = 'Do you really want to close?'
			this.cancelSure = true;
		} else {
			this.addEditModal.close();
		}
	}
	deleteEvent() {
		this.message = null
		this.load_delete = true;
		this.http.delete(this.URL + '/' + this.event._id).subscribe(
			res => {
				console.log('Record Deleted Successfully');
				this.deleteModal.close();
				this.get(0, null);
				this.load_delete = false;
			},
			err => {
				this.load_delete = false;
				if(err.status==400){
					this.message = err.error.message;
				}else{
					this.message = 'Unable to delete';
				}
			}
		);
	}
}
